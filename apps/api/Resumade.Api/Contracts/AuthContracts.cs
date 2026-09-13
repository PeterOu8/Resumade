using System.ComponentModel.DataAnnotations;
using Resumade.Application.Identity;

namespace Resumade.Api.Contracts;

public sealed record RegisterRequest(
    [Required, EmailAddress, StringLength(320)] string Email,
    [Required, StringLength(128, MinimumLength = 12)] string Password);

public sealed record LoginRequest(
    [Required, EmailAddress, StringLength(320)] string Email,
    [Required, StringLength(128)] string Password);

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserResponse User)
{
    public static AuthResponse From(AuthenticationResult result) =>
        new(result.AccessToken, result.ExpiresAt, new UserResponse(result.User.Id, result.User.Email));
}

public sealed record UserResponse(Guid Id, string Email);
