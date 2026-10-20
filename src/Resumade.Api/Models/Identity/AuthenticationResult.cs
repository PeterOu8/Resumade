using Resumade.Api.Models.Entities.Identity;

namespace Resumade.Api.Models.Identity;

public sealed record AuthenticationResult(string AccessToken, DateTimeOffset ExpiresAt, AuthenticatedUser User);
