using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Resumade.Api.Services.Interfaces;

namespace Resumade.Api.Infrastructure.Authentication;

public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal Principal => httpContextAccessor.HttpContext?.User ?? new ClaimsPrincipal();

    public bool IsAuthenticated => Principal.Identity?.IsAuthenticated == true;

    public Guid UserId => Guid.TryParse(Principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var userId)
        ? userId
        : throw new UnauthorizedAccessException("The authenticated identity does not contain a valid user identifier.");

    public string? Email => Principal.FindFirstValue(JwtRegisteredClaimNames.Email);
}
