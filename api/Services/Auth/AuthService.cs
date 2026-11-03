using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
        private readonly ResumadeDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public AuthService(ResumadeDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponse?> RegisterAsync(RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return null;

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
                return null;
            }

            return CreateAuthResponse(user);
        }

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
                throw new UnauthorizedAccessException("Invalid Google token");
            }

            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
                throw new UnauthorizedAccessException("Email not verified");

            var email = payload.Email.Trim().ToLowerInvariant();
            if (!email.EndsWith("@gmail.com", StringComparison.Ordinal) &&
                string.IsNullOrWhiteSpace(payload.HostedDomain))
                throw new UnauthorizedAccessException("Google does not manage this email address");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user is null)
            {
                user = new User
                {
                    Email = email,
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
                throw new UnauthorizedAccessException("This email already uses password sign-in");

            return CreateAuthResponse(user);
        }

        public async Task<AuthResponse?> SignInAsync(SignInDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email.Trim().ToLowerInvariant());

            if (user == null || string.IsNullOrEmpty(user.PasswordHash))
                return null;

            var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);

            if (result == PasswordVerificationResult.Failed)
                return null;

            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);
                await _context.SaveChangesAsync();
            }

            return CreateAuthResponse(user);
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
