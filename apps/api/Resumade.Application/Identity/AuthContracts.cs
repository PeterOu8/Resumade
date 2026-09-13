using Resumade.Domain.Identity;

namespace Resumade.Application.Identity;

public sealed record RegisterUserCommand(string Email, string Password);
public sealed record LoginCommand(string Email, string Password);
public sealed record AuthenticatedUser(Guid Id, string Email);
public sealed record AuthenticationResult(string AccessToken, DateTimeOffset ExpiresAt, AuthenticatedUser User);

public interface IUserRepository
{
    Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task<User?> FindByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken);
    Task AddAsync(User user, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IPasswordService
{
    string Hash(User user, string password);
    bool Verify(User user, string passwordHash, string password);
}

public interface IAccessTokenFactory
{
    AuthenticationResult Create(User user);
}
