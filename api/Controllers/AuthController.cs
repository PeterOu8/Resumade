using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using Resumade.Api.Dtos.Auth;
using Resumade.Api.Models;
using Resumade.Api.Services.Auth;

namespace Resumade.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            var result = await _authService.RegisterAsync(dto);

            if (!result)
                return Conflict("Email is already registered.");

            return Accepted();
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(AccountEmailDto dto)
        {
            await _authService.RequestAccountEmailAsync(dto.Email, AccountAction.VerifyEmail);
            return Accepted();
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(AccountEmailDto dto)
        {
            await _authService.RequestAccountEmailAsync(dto.Email, AccountAction.ResetPassword);
            return Accepted();
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto) =>
            await _authService.VerifyEmailAsync(dto.Token)
                ? NoContent() : BadRequest("This link is invalid or has expired.");

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto) =>
            await _authService.ResetPasswordAsync(dto.Token, dto.Password)
                ? NoContent() : BadRequest("This link is invalid or has expired.");

        [HttpPost("signin")]
        public async Task<ActionResult<AuthResponse>> SignIn(SignInDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            var result = await _authService.SignInAsync(dto);

            if (result == null)
                return Unauthorized("Invalid email or password.");

            return Ok(result);
        }

        [HttpPost("google")]
        public async Task<ActionResult<AuthResponse>> Google(GoogleSignInDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.IdToken))
                return BadRequest("Google ID token is required.");

            try
            {
                return Ok(await _authService.SignInWithGoogleAsync(dto.IdToken));
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized();
            }
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = User.FindFirstValue(ClaimTypes.Email);
            var displayName = User.FindFirstValue(ClaimTypes.Name);

            if (userId == null)
                return Unauthorized();

            return Ok(new
            {
                UserId = userId,
                Email = email,
                DisplayName = displayName
            });
        }
    }
}
