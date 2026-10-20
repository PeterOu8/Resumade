using Resumade.Api.Models.Identity;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Identity;

namespace Resumade.Api.Services;

public sealed class AuthService(IUserRepository users, IPasswordService passwords, IAccessTokenFactory tokens)
{
    public async Task<AuthenticationResult> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var email = NormalizeDisplayEmail(command.Email);
        var normalizedEmail = email.ToUpperInvariant();

        if (await users.EmailExistsAsync(normalizedEmail, cancellationToken))
            throw new IdentityConflictException("An account with this email already exists.");

        var user = new User(Guid.NewGuid(), email, normalizedEmail, string.Empty);
        var passwordHash = passwords.Hash(user, command.Password);
        user = new User(user.Id, email, normalizedEmail, passwordHash);

        await users.AddAsync(user, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        return tokens.Create(user);
    }

    public async Task<AuthenticationResult> LoginAsync(LoginCommand command, CancellationToken cancellationToken)
    {
        var normalizedEmail = NormalizeDisplayEmail(command.Email).ToUpperInvariant();
        var user = await users.FindByNormalizedEmailAsync(normalizedEmail, cancellationToken);

        if (user is null || !passwords.Verify(user, user.PasswordHash, command.Password))
            throw new InvalidCredentialsException();

        return tokens.Create(user);
    }

    private static string NormalizeDisplayEmail(string email) => email.Trim();
}

public sealed class IdentityConflictException(string message) : Exception(message);
public sealed class InvalidCredentialsException : Exception;
