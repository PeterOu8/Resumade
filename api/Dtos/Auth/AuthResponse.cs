namespace Resumade.Api.Dtos.Auth
{
    public sealed record AuthUser(
        Guid UserId,
        string DisplayName,
        string Email
    );

    public sealed record AuthResponse(
        AuthUser User,
        string AccessToken
    );
}
