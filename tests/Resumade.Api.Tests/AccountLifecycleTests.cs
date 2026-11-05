using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Resumade.Api.Data;
using Resumade.Api.Dtos.Auth;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Models;
using Resumade.Api.Services.Auth;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class PostgresAuthFactAttribute : FactAttribute
{
    public PostgresAuthFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("RESUMADE_AUTH_TEST_POSTGRES")))
            Skip = "Set RESUMADE_AUTH_TEST_POSTGRES to a PostgreSQL test database connection string.";
    }
}

public sealed class AccountLifecycleTests
{
    private const string Key = "resumade-auth-tests-signing-key-with-at-least-32-characters";
    private const string Audience = "auth-tests";
    private const string Email = "developer@example.test";
    private const string Password = "original-password";
    private const string NewPassword = "replacement-password";
    private int _requestNumber;

    [PostgresAuthFact]
    public async Task VerificationAndPasswordResetEnforceAccountAndTokenState()
    {
        var settings = new NpgsqlConnectionStringBuilder(
            Environment.GetEnvironmentVariable("RESUMADE_AUTH_TEST_POSTGRES"));
        var schema = $"auth_test_{Guid.NewGuid():N}";
        await using var connection = new NpgsqlConnection(settings.ConnectionString);
        await connection.OpenAsync();
        await using (var create = new NpgsqlCommand($"CREATE SCHEMA {schema}", connection))
            await create.ExecuteNonQueryAsync();

        settings.SearchPath = schema;
        var sender = new RecordingSender();
        try
        {
            await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            {
                builder.UseSetting("Jwt:Key", Key);
                builder.UseSetting("Jwt:Issuer", Audience);
                builder.UseSetting("Jwt:Audience", Audience);
                builder.UseSetting("Proxy:KnownProxies:0", "127.0.0.1");
                builder.UseSetting("ConnectionStrings:ResumadeDatabase", settings.ConnectionString);
                builder.ConfigureServices(services =>
                {
                    services.AddSingleton<IAccountEmailSender>(sender);
                    services.AddSingleton<IStartupFilter, LoopbackStartupFilter>();
                });
            });
            using var client = factory.CreateClient();
            await using var scope = factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
            await db.Database.MigrateAsync();

            using var registration = await Post(client, "register", new { Email, Password, DisplayName = "Test" });
            Assert.Equal(HttpStatusCode.Accepted, registration.StatusCode);
            Assert.Empty(await registration.Content.ReadAsStringAsync());
            var user = await db.Users.AsNoTracking().SingleAsync(u => u.Email == Email);
            Assert.Null(user.EmailVerifiedAtUtc);
            var verify = Assert.Single(sender.Tokens);
            Assert.NotEqual(verify, await db.AccountActionTokens.Select(t => t.Hash).SingleAsync());
            Assert.Equal(HttpStatusCode.Unauthorized, await SignIn(client, Password));
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, Jwt(user.Id, "0")));
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "reset-password", new { Token = verify, Password }));
            Assert.Equal(HttpStatusCode.Accepted, await Status(client, "resend-verification", new { Email = "DEVELOPER@example.test" }));
            Assert.Single(sender.Tokens);

            await db.AccountActionTokens.ExecuteUpdateAsync(setters => setters
                .SetProperty(t => t.CreatedAtUtc, DateTime.UtcNow.AddHours(-25))
                .SetProperty(t => t.ExpiresAtUtc, DateTime.UtcNow.AddHours(-1)));
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "verify-email", new { Token = verify }));
            Assert.Equal(HttpStatusCode.Accepted, await Status(client, "resend-verification", new { Email }));
            verify = sender.Tokens.Last();
            Assert.Equal(HttpStatusCode.NoContent, await Status(client, "verify-email", new { Token = verify }));
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "verify-email", new { Token = verify }));

            using var login = await Post(client, "signin", new { Email, Password });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
            var auth = (await login.Content.ReadFromJsonAsync<AuthResponse>())!;
            Assert.Equal(HttpStatusCode.OK, await Me(client, auth.AccessToken));
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, Jwt(user.Id, null)));
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, Jwt(user.Id, "bad")));
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, Jwt(user.Id, "0", expired: true)));

            for (var attempt = 0; attempt < 5; attempt++)
                Assert.Equal(HttpStatusCode.Unauthorized, await SignIn(client, "incorrect-password"));
            Assert.Equal(HttpStatusCode.Unauthorized, await SignIn(client, Password));

            using var unknown = await Post(client, "forgot-password", new { Email = "unknown@example.test" });
            using var known = await Post(client, "forgot-password", new { Email });
            Assert.Equal(HttpStatusCode.Accepted, unknown.StatusCode);
            Assert.Equal(known.StatusCode, unknown.StatusCode);
            Assert.Equal(await known.Content.ReadAsStringAsync(), await unknown.Content.ReadAsStringAsync());
            var reset = sender.Tokens.Last();
            Assert.Equal(HttpStatusCode.Accepted, await Status(client, "forgot-password", new { Email }));
            Assert.Equal(3, sender.Tokens.Count);
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "verify-email", new { Token = reset }));

            var resets = db.AccountActionTokens.Where(t => t.Purpose == AccountAction.ResetPassword);
            await resets.ExecuteUpdateAsync(setters => setters
                .SetProperty(t => t.CreatedAtUtc, DateTime.UtcNow.AddMinutes(-31))
                .SetProperty(t => t.ExpiresAtUtc, DateTime.UtcNow.AddMinutes(-1)));
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "reset-password", new { Token = reset, Password }));
            Assert.Equal(HttpStatusCode.Accepted, await Status(client, "forgot-password", new { Email }));
            reset = sender.Tokens.Last();
            await resets.ExecuteUpdateAsync(setters => setters
                .SetProperty(t => t.CreatedAtUtc, DateTime.UtcNow.AddMinutes(-2)));
            Assert.Equal(HttpStatusCode.Accepted, await Status(client, "forgot-password", new { Email }));
            var otherReset = sender.Tokens.Last();
            var results = await Task.WhenAll(
                Status(client, "reset-password", new { Token = reset, Password = NewPassword }),
                Status(client, "reset-password", new { Token = otherReset, Password = NewPassword }));
            Assert.Single(results, status => status == HttpStatusCode.NoContent);
            Assert.Single(results, status => status == HttpStatusCode.BadRequest);
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "reset-password", new { Token = reset, Password }));
            Assert.Equal(HttpStatusCode.BadRequest, await Status(client, "reset-password", new { Token = otherReset, Password }));
            var updated = await db.Users.AsNoTracking().SingleAsync(u => u.Id == user.Id);
            Assert.NotEqual(user.PasswordHash, updated.PasswordHash);
            Assert.Equal(1, updated.SecurityVersion);
            Assert.Equal(0, updated.FailedSignInAttempts);
            Assert.Null(updated.LockoutEndUtc);
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, auth.AccessToken));
            Assert.Equal(HttpStatusCode.Unauthorized, await SignIn(client, Password));
            Assert.Equal(HttpStatusCode.OK, await SignIn(client, NewPassword));

            db.Resumes.AddRange(Enumerable.Range(1, 15).Select(i => new Resume { UserId = user.Id, Title = $"Resume {i}" }));
            await db.SaveChangesAsync();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Jwt(user.Id, "1"));
            var draft = new SaveResumeDto { Title = "Concurrent save", Content = new ResumeContentDto() };
            using var firstSave = new HttpRequestMessage(HttpMethod.Post, "/api/resumes") { Content = JsonContent.Create(draft) };
            using var secondSave = new HttpRequestMessage(HttpMethod.Post, "/api/resumes") { Content = JsonContent.Create(draft) };
            var saves = await Task.WhenAll(client.SendAsync(firstSave), client.SendAsync(secondSave));
            using var firstResult = saves[0];
            using var secondResult = saves[1];
            Assert.Single(saves, response => response.StatusCode == HttpStatusCode.Created);
            Assert.Single(saves, response => response.StatusCode == HttpStatusCode.Conflict);
            Assert.Equal(16, await db.Resumes.CountAsync(r => r.UserId == user.Id));
            client.DefaultRequestHeaders.Authorization = null;

            var googlePayload = new GoogleJsonWebSignature.Payload
            {
                Email = "google-user@gmail.com", EmailVerified = true, Name = "Google User"
            };
            var service = scope.ServiceProvider.GetRequiredService<AuthService>();
            var google = await service.SignInWithGooglePayloadAsync(googlePayload);
            Assert.Equal(HttpStatusCode.OK, await Me(client, google.AccessToken));
            googlePayload.EmailVerified = false;
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.SignInWithGooglePayloadAsync(googlePayload));
            googlePayload.EmailVerified = true;
            googlePayload.Email = Email;
            googlePayload.HostedDomain = "example.test";
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.SignInWithGooglePayloadAsync(googlePayload));

            await db.Users.Where(u => u.Id == user.Id).ExecuteDeleteAsync();
            Assert.Equal(HttpStatusCode.Unauthorized, await Me(client, Jwt(user.Id, "1")));
            Assert.False(await db.AccountActionTokens.AnyAsync(t => t.UserId == user.Id));
        }
        finally
        {
            await using var drop = new NpgsqlCommand($"DROP SCHEMA {schema} CASCADE", connection);
            await drop.ExecuteNonQueryAsync();
        }
    }

    private Task<HttpStatusCode> SignIn(HttpClient client, string password) =>
        Status(client, "signin", new { Email, Password = password });

    private async Task<HttpStatusCode> Status(HttpClient client, string path, object payload)
    {
        using var response = await Post(client, path, payload);
        return response.StatusCode;
    }

    private async Task<HttpResponseMessage> Post(HttpClient client, string path, object payload)
    {
        using var request = Request(HttpMethod.Post, path);
        request.Content = JsonContent.Create(payload);
        return await client.SendAsync(request);
    }

    private async Task<HttpStatusCode> Me(HttpClient client, string token)
    {
        using var request = Request(HttpMethod.Get, "me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        using var response = await client.SendAsync(request);
        return response.StatusCode;
    }

    private HttpRequestMessage Request(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, $"/api/auth/{path}");
        request.Headers.Add("X-Forwarded-For", $"203.0.113.{Interlocked.Increment(ref _requestNumber)}");
        return request;
    }

    private static string Jwt(Guid userId, string? version, bool expired = false)
    {
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, userId.ToString()) };
        if (version is not null)
            claims.Add(new Claim("sv", version));

        var token = new JwtSecurityToken(Audience, Audience, claims,
            expires: DateTime.UtcNow.AddMinutes(expired ? -1 : 5),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key)), SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private sealed class RecordingSender : IAccountEmailSender
    {
        public ConcurrentQueue<string> Tokens { get; } = new();

        public Task SendAsync(string recipient, string subject, string path, string token)
        {
            Tokens.Enqueue(token);
            return Task.CompletedTask;
        }
    }

    private sealed class LoopbackStartupFilter : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
        {
            app.Use((context, following) =>
            {
                context.Connection.RemoteIpAddress = IPAddress.Loopback;
                return following();
            });
            next(app);
        };
    }
}
