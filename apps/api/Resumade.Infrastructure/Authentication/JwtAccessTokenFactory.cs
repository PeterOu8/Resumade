using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Resumade.Application.Identity;
using Resumade.Domain.Identity;

namespace Resumade.Infrastructure.Authentication;

public sealed class JwtAccessTokenFactory(IOptions<JwtOptions> options) : IAccessTokenFactory
{
    public AuthenticationResult Create(User user)
    {
        var settings = options.Value;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(settings.AccessTokenLifetimeMinutes);
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = settings.Issuer,
            Audience = settings.Audience,
            Expires = expiresAt.UtcDateTime,
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            ]),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SigningKey)),
                SecurityAlgorithms.HmacSha256)
        };

        var token = new JwtSecurityTokenHandler().CreateToken(descriptor);
        return new AuthenticationResult(new JwtSecurityTokenHandler().WriteToken(token), expiresAt,
            new AuthenticatedUser(user.Id, user.Email));
    }
}
