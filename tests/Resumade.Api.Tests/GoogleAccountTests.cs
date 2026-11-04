using Google.Apis.Auth;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Resumade.Api.Data;
using Resumade.Api.Models;
using Resumade.Api.Services.Auth;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class GoogleAccountTests : IAsyncLifetime
{
    private const string Email = "returning-user@gmail.com";
    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly IConfiguration _configuration = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "resumade-google-account-test-signing-key",
            ["Jwt:Issuer"] = "google-account-tests",
            ["Jwt:Audience"] = "google-account-tests"
        })
        .Build();

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        await using var db = CreateDbContext();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync() => await _connection.DisposeAsync();

    [Fact]
    public async Task ReturningGoogleUserCanSignInWithTheSameAccount()
    {
        await using var firstRequest = CreateDbContext();
        var initial = await CreateAuthService(firstRequest).SignInWithGooglePayloadAsync(VerifiedPayload("Returning-User@gmail.com"));
        var created = await firstRequest.Users.AsNoTracking().SingleAsync();
        Assert.Equal(Email, created.Email);
        Assert.Null(created.PasswordHash);
        Assert.NotNull(created.EmailVerifiedAtUtc);

        await using var secondRequest = CreateDbContext();
        var returning = await CreateAuthService(secondRequest).SignInWithGooglePayloadAsync(VerifiedPayload(Email));

        Assert.Equal(initial.User.UserId, returning.User.UserId);
        Assert.Equal(created.Id, returning.User.UserId);
        Assert.False(string.IsNullOrWhiteSpace(returning.AccessToken));
        var persisted = await secondRequest.Users.AsNoTracking().SingleAsync();
        Assert.Equal(created.EmailVerifiedAtUtc, persisted.EmailVerifiedAtUtc);
        Assert.Null(persisted.PasswordHash);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public async Task LegacyGoogleOnlyAccountIsVerifiedOnSignIn(string? passwordHash)
    {
        await using var db = CreateDbContext();
        var legacy = new User { Email = Email, PasswordHash = passwordHash };
        db.Users.Add(legacy);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var response = await CreateAuthService(db).SignInWithGooglePayloadAsync(VerifiedPayload(Email));

        Assert.Equal(legacy.Id, response.User.UserId);
        var persisted = await db.Users.AsNoTracking().SingleAsync();
        Assert.NotNull(persisted.EmailVerifiedAtUtc);
        Assert.Equal(passwordHash, persisted.PasswordHash);
    }

    [Fact]
    public async Task GoogleSignInCannotTakeOverAnExistingPasswordAccount()
    {
        await using var db = CreateDbContext();
        var passwordAccount = new User { Email = Email, PasswordHash = "existing-password-hash" };
        db.Users.Add(passwordAccount);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            CreateAuthService(db).SignInWithGooglePayloadAsync(VerifiedPayload(Email)));

        var persisted = await db.Users.AsNoTracking().SingleAsync();
        Assert.Equal(passwordAccount.Id, persisted.Id);
        Assert.Equal(passwordAccount.PasswordHash, persisted.PasswordHash);
        Assert.Null(persisted.EmailVerifiedAtUtc);
    }

    private ResumadeDbContext CreateDbContext() =>
        new(new DbContextOptionsBuilder<ResumadeDbContext>().UseSqlite(_connection).Options);

    private AuthService CreateAuthService(ResumadeDbContext db) =>
        new(db, _configuration, new UnexpectedEmailSender(), NullLogger<AuthService>.Instance);

    private static GoogleJsonWebSignature.Payload VerifiedPayload(string email) =>
        new() { Email = email, EmailVerified = true, Name = "Returning Google User" };

    private sealed class UnexpectedEmailSender : IAccountEmailSender
    {
        public Task SendAsync(string recipient, string subject, string path, string token) =>
            throw new InvalidOperationException("Google sign-in should not send email.");
    }
}
