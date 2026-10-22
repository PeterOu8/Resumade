using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Models;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Identity;
using Resumade.Api.Services;

namespace Resumade.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RegisterAsync(new RegisterUserCommand(request.Email, request.Password), cancellationToken);
            return Created(string.Empty, AuthResponse.From(result));
        }
        catch (IdentityConflictException exception)
        {
            return Conflict(new ProblemDetails { Title = "Registration failed", Detail = exception.Message });
        }
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.LoginAsync(new LoginCommand(request.Email, request.Password), cancellationToken);
            return Ok(AuthResponse.From(result));
        }
        catch (InvalidCredentialsException)
        {
            // Keep the response identical for unknown emails and incorrect passwords.
            return Unauthorized(new ProblemDetails { Title = "Invalid email or password." });
        }
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UserResponse> Me()
    {
        var email = currentUser.Email;
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        return Ok(new UserResponse(currentUser.UserId, email));
    }
}
