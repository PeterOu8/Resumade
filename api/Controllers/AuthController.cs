using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Resumade.Api.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using Resumade.Api.Dtos.Auth;

namespace Resumade.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            var result = await _authService.RegisterAsync(dto);

            if (result == null)
                return Conflict("Email is already registered.");

            return Ok(result);
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            var result = await _authService.LoginAsync(dto);

            if (result == null)
                return Unauthorized("Invalid email or password.");

            return Ok(result);
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
