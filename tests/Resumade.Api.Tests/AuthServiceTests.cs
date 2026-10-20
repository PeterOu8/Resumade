using Resumade.Api.Models.Identity;
using Resumade.Api.Services;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Identity;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_normalizes_lookup_email_and_preserves_display_email()
    {
        var repository = new FakeUserRepository();
        var service = new AuthService(repository, new FakePasswordService(), new FakeAccessTokenFactory());

        await service.RegisterAsync(new RegisterUserCommand("  Jane.Doe@Example.com ", "long-enough-password"), CancellationToken.None);

        Assert.NotNull(repository.AddedUser);
        Assert.Equal("Jane.Doe@Example.com", repository.AddedUser!.Email);
        Assert.Equal("JANE.DOE@EXAMPLE.COM", repository.AddedUser.NormalizedEmail);
        Assert.Equal("hash:long-enough-password", repository.AddedUser.PasswordHash);
        Assert.True(repository.SaveCalled);
    }

    [Fact]
    public async Task LoginAsync_rejects_unknown_user_without_disclosing_which_credential_failed()
    {
        var service = new AuthService(new FakeUserRepository(), new FakePasswordService(), new FakeAccessTokenFactory());

        await Assert.ThrowsAsync<InvalidCredentialsException>(() =>
            service.LoginAsync(new LoginCommand("nobody@example.com", "long-enough-password"), CancellationToken.None));
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        public User? AddedUser { get; private set; }
        public bool SaveCalled { get; private set; }
        public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<User?> FindByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken) => Task.FromResult<User?>(null);
        public Task AddAsync(User user, CancellationToken cancellationToken) { AddedUser = user; return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken cancellationToken) { SaveCalled = true; return Task.CompletedTask; }
    }

    private sealed class FakePasswordService : IPasswordService
    {
        public string Hash(User user, string password) => $"hash:{password}";
        public bool Verify(User user, string passwordHash, string password) => passwordHash == $"hash:{password}";
    }

    private sealed class FakeAccessTokenFactory : IAccessTokenFactory
    {
        public AuthenticationResult Create(User user) => new("token", DateTimeOffset.UtcNow.AddMinutes(30), new(user.Id, user.Email));
    }
}
