using Resumade.Api.Models.Identity;

namespace Resumade.Api.Models;

public sealed record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserResponse User)
{
    public static AuthResponse From(AuthenticationResult result) =>
        new(result.AccessToken, result.ExpiresAt, new UserResponse(result.User.Id, result.User.Email));
}
