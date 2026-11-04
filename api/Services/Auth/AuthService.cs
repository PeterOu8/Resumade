using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Resumade.Api.Data;
using Resumade.Api.Models;
using Npgsql;
using Resumade.Api.Dtos.Auth;

namespace Resumade.Api.Services.Auth
{
    public class AuthService
    {
        private const int MaxFailedSignInAttempts = 5;
        private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
        private readonly ResumadeDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher = new();

        private readonly IAccountEmailSender _emailSender;
        private readonly ILogger<AuthService> _logger;

        public AuthService(ResumadeDbContext context, IConfiguration configuration,
            IAccountEmailSender emailSender, ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task<bool> RegisterAsync(RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return false;

            var user = new User
            {
                Email = email,
                DisplayName = dto.DisplayName.Trim(),
                PasswordHash = string.Empty
            };
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException exception) when (
                exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                _context.Entry(user).State = EntityState.Detached;
                return false;
            }

            await RequestAccountEmailAsync(email, AccountAction.VerifyEmail);
            return true;
        }

        public async Task RequestAccountEmailAsync(string email, AccountAction purpose)
        {
            email = email.Trim().ToLowerInvariant();
            await using var transaction = await _context.Database.BeginTransactionAsync();
            var users = await _context.Users
                .FromSql($"SELECT * FROM \"Users\" WHERE \"Email\" = {email} FOR UPDATE")
                .AsNoTracking().ToListAsync();
            var user = users.SingleOrDefault();
            if (user is null || string.IsNullOrEmpty(user.PasswordHash) ||
                (purpose == AccountAction.VerifyEmail && user.EmailVerifiedAtUtc != null))
                return;

            var now = DateTime.UtcNow;
            var tokens = _context.AccountActionTokens.Where(t => t.UserId == user.Id && t.Purpose == purpose);
            var lastHour = now.AddHours(-1);
            var recent = await tokens.Where(t => t.CreatedAtUtc > lastHour)
                .OrderByDescending(t => t.CreatedAtUtc).Select(t => t.CreatedAtUtc).Take(5).ToListAsync();
            if (recent.Count >= 5 || (recent.Count > 0 && recent[0] > now.AddMinutes(-1)))
                return;

            // Retain recent attempts for throttling, including failed deliveries and redeemed tokens.
            await tokens.Where(t => t.CreatedAtUtc <= lastHour && t.ExpiresAtUtc <= now).ExecuteDeleteAsync();
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var verify = purpose == AccountAction.VerifyEmail;
            _context.AccountActionTokens.Add(new AccountActionToken
            {
                Hash = HashToken(rawToken),
                UserId = user.Id,
                Purpose = purpose,
                CreatedAtUtc = now,
                ExpiresAtUtc = verify ? now.AddHours(24) : now.AddMinutes(30)
            });
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            try
            {
                await _emailSender.SendAsync(user.Email, verify ? "Verify your email" : "Reset your password",
                    verify ? "/verify-email" : "/reset-password", rawToken);
            }
            catch (Exception)
            {
                // Provider errors can include message details. Keep diagnostics free of recipient and link data.
                _logger.LogWarning("Account email delivery failed for {Purpose}.", purpose);
            }
        }

        public Task<bool> VerifyEmailAsync(string token) =>
            RedeemTokenAsync(token, AccountAction.VerifyEmail);

        public Task<bool> ResetPasswordAsync(string token, string password) =>
            RedeemTokenAsync(token, AccountAction.ResetPassword, password);

        private async Task<bool> RedeemTokenAsync(string rawToken, AccountAction purpose, string? password = null)
        {
            var hash = HashToken(rawToken);
            var userId = await _context.AccountActionTokens
                .Where(t => t.Hash == hash && t.Purpose == purpose && t.ConsumedAtUtc == null &&
                    t.ExpiresAtUtc > DateTime.UtcNow)
                .Select(t => (Guid?)t.UserId).SingleOrDefaultAsync();
            if (userId is null)
                return false;

            await using var transaction = await _context.Database.BeginTransactionAsync();
            // All issuances and redemptions for this user take the same PostgreSQL row lock.
            var users = await _context.Users
                .FromSql($"SELECT * FROM \"Users\" WHERE \"Id\" = {userId.Value} FOR UPDATE").ToListAsync();
            var user = users.SingleOrDefault();
            if (user is null || string.IsNullOrEmpty(user.PasswordHash) ||
                (purpose == AccountAction.VerifyEmail && user.EmailVerifiedAtUtc != null))
                return false;

            var now = DateTime.UtcNow;
            var tokens = _context.AccountActionTokens
                .Where(t => t.UserId == user.Id && t.Purpose == purpose && t.ConsumedAtUtc == null);
            if (!await tokens.AnyAsync(t => t.Hash == hash && t.ExpiresAtUtc > now))
                return false;

            await tokens.ExecuteUpdateAsync(setters => setters.SetProperty(t => t.ConsumedAtUtc, now));
            if (purpose == AccountAction.VerifyEmail)
            {
                user.EmailVerifiedAtUtc = now;
            }
            else
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, password!);
                user.SecurityVersion++;
                user.FailedSignInAttempts = 0;
                user.LockoutEndUtc = null;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }

        private static string HashToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        public async Task<AuthResponse> SignInWithGoogleAsync(string idToken)
        {
            var clientId = _configuration["Google:ClientId"];
            if (string.IsNullOrWhiteSpace(clientId))
                throw new InvalidOperationException("Google:ClientId is missing");

            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            }
            catch (InvalidJwtException)
            {
                throw GoogleSignInRejection("invalid_token");
            }

            return await SignInWithGooglePayloadAsync(payload);
        }

        internal async Task<AuthResponse> SignInWithGooglePayloadAsync(GoogleJsonWebSignature.Payload payload)
        {
            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
                throw GoogleSignInRejection("unverified_email");

            var email = payload.Email.Trim().ToLowerInvariant();
            if (!email.EndsWith("@gmail.com", StringComparison.Ordinal) &&
                string.IsNullOrWhiteSpace(payload.HostedDomain))
                throw GoogleSignInRejection("unmanaged_email");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
            {
                user = new User
                {
                    Email = email,
                    EmailVerifiedAtUtc = DateTime.UtcNow,
                    PasswordHash = null,
                    DisplayName = string.IsNullOrWhiteSpace(payload.Name) ? email : payload.Name,
                };
                _context.Users.Add(user);
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateException exception) when (
                    exception.InnerException is PostgresException
                    { SqlState: PostgresErrorCodes.UniqueViolation })
                {
                    _context.Entry(user).State = EntityState.Detached;
                    user = await _context.Users.SingleAsync(u => u.Email == email);
                }
            }

            if (!string.IsNullOrEmpty(user.PasswordHash))
                throw GoogleSignInRejection("password_account_exists");

            if (user.EmailVerifiedAtUtc is null)
            {
                user.EmailVerifiedAtUtc = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return CreateAuthResponse(user);
        }

        private UnauthorizedAccessException GoogleSignInRejection(string reason)
        {
            _logger.LogWarning("Google sign-in rejected: {Reason}.", reason);
            return new UnauthorizedAccessException("Google sign-in was rejected.");
        }

        public async Task<AuthResponse?> SignInAsync(SignInDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLowerInvariant());

            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                return null;

            var now = DateTime.UtcNow;
            if (user.LockoutEndUtc > now)
                return null;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                user.FailedSignInAttempts++;
                if (user.FailedSignInAttempts >= MaxFailedSignInAttempts)
                {
                    user.FailedSignInAttempts = 0;
                    user.LockoutEndUtc = now.Add(LockoutDuration);
                }

                await SaveSignInStateAsync();
                return null;
            }

            user.FailedSignInAttempts = 0;
            user.LockoutEndUtc = null;

            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
            }

            if (!await SaveSignInStateAsync() || user.EmailVerifiedAtUtc is null)
                return null;

            return CreateAuthResponse(user);
        }

        private async Task<bool> SaveSignInStateAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                return false;
            }
        }

        private AuthResponse CreateAuthResponse(User user)
        {
            var token = GenerateJwtToken(user);

            return new AuthResponse
            (
                new AuthUser(
                    user.Id,
                    user.DisplayName,
                    user.Email
                ),
                token
            );
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("sv", user.SecurityVersion.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                new Claim(ClaimTypes.Name, user.DisplayName)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
