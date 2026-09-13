using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Resumade.Domain.Identity;
using Resumade.Domain.Profiles;
using Resumade.Infrastructure.Persistence;
using Xunit;

namespace Resumade.IntegrationTests;

public sealed class AuthenticationAndProfileTests(ResumadeApiFactory factory) : IClassFixture<ResumadeApiFactory>
{
    [Fact]
    public async Task Profile_endpoints_reject_anonymous_requests()
    {
        using var client = factory.CreateClient();

        var getResponse = await client.GetAsync("/api/profile");
        var putResponse = await client.PutAsJsonAsync("/api/profile", ValidProfile("Anonymous"));

        Assert.Equal(HttpStatusCode.Unauthorized, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, putResponse.StatusCode);
    }

    [Fact]
    public async Task Registration_login_and_token_validation_work_over_http()
    {
        using var client = factory.CreateClient();
        var email = UniqueEmail();
        Guid? userId = null;

        try
        {
            var registration = await RegisterAsync(client, email);
            userId = registration.UserId;

            await using (var scope = factory.Services.CreateAsyncScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
                var persisted = await db.Users.AsNoTracking().SingleAsync(x => x.Id == userId);
                Assert.NotEqual(TestPassword, persisted.PasswordHash);
                Assert.DoesNotContain(TestPassword, persisted.PasswordHash, StringComparison.Ordinal);

                db.Users.Add(new User(Guid.NewGuid(), "duplicate@example.com", email.ToUpperInvariant(), "hash"));
                await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            }

            var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = TestPassword });
            Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
            var login = await ReadAuthAsync(loginResponse);

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.AccessToken);
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Tamper(login.AccessToken));
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/auth/me")).StatusCode);
        }
        finally
        {
            if (userId is not null)
                await DeleteUsersAsync(userId.Value);
        }
    }

    [Fact]
    public async Task Profile_upsert_retrieval_validation_and_ownership_are_enforced()
    {
        using var clientA = factory.CreateClient();
        using var clientB = factory.CreateClient();
        var userA = await RegisterAsync(clientA, UniqueEmail());
        var userB = await RegisterAsync(clientB, UniqueEmail());

        try
        {
            Authorize(clientA, userA.AccessToken);
            Authorize(clientB, userB.AccessToken);

            Assert.Equal(HttpStatusCode.NotFound, (await clientA.GetAsync("/api/profile")).StatusCode);

            var createA = await clientA.PutAsJsonAsync("/api/profile", ValidProfile("Alice"));
            var createB = await clientB.PutAsJsonAsync("/api/profile", ValidProfile("Bob"));
            Assert.Equal(HttpStatusCode.OK, createA.StatusCode);
            Assert.Equal(HttpStatusCode.OK, createB.StatusCode);

            var retrievedA = await clientA.GetFromJsonAsync<ProfileDocument>("/api/profile");
            Assert.Equal("Alice", retrievedA!.FirstName);

            var manipulatedBody = new
            {
                userId = userB.UserId,
                firstName = "Alice Updated",
                lastName = "Engineer",
                portfolioUrl = "https://example.com/alice"
            };
            var updateA = await clientA.PutAsJsonAsync($"/api/profile?userId={userB.UserId}", manipulatedBody);
            Assert.Equal(HttpStatusCode.OK, updateA.StatusCode);

            var persistedA = await clientA.GetFromJsonAsync<ProfileDocument>("/api/profile");
            var untouchedB = await clientB.GetFromJsonAsync<ProfileDocument>("/api/profile");
            Assert.Equal("Alice Updated", persistedA!.FirstName);
            Assert.Equal("Bob", untouchedB!.FirstName);

            var invalid = await clientA.PutAsJsonAsync("/api/profile", new
            {
                firstName = "Alice",
                lastName = "Engineer",
                linkedInUrl = "not a url"
            });
            Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

            await AssertOneProfileConstraintAsync(userA.UserId);
        }
        finally
        {
            await DeleteUsersAsync(userA.UserId, userB.UserId);
        }
    }

    private const string TestPassword = "A-valid-test-password-123!";

    private static object ValidProfile(string firstName) => new
    {
        firstName,
        lastName = "Engineer",
        headline = "Software Engineer",
        location = "Melbourne, Australia",
        phone = "+61 400 000 000",
        linkedInUrl = "https://www.linkedin.com/in/example",
        gitHubUrl = "https://github.com/example",
        portfolioUrl = "https://example.com",
        summary = "Builds reliable software."
    };

    private static string UniqueEmail() => $"integration-{Guid.NewGuid():N}@example.com";

    private static void Authorize(HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private static string Tamper(string token)
    {
        var sections = token.Split('.');
        sections[1] = (sections[1][0] == 'a' ? 'b' : 'a') + sections[1][1..];
        return string.Join('.', sections);
    }

    private static async Task<AuthenticationDocument> RegisterAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = TestPassword });
        if (response.StatusCode != HttpStatusCode.Created)
            Assert.Fail($"Registration returned {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
        return await ReadAuthAsync(response);
    }

    private static async Task<AuthenticationDocument> ReadAuthAsync(HttpResponseMessage response)
    {
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = json.RootElement;
        return new AuthenticationDocument(
            root.GetProperty("accessToken").GetString()!,
            root.GetProperty("user").GetProperty("id").GetGuid());
    }

    private async Task AssertOneProfileConstraintAsync(Guid userId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        db.Profiles.Add(new UserProfile(Guid.NewGuid(), userId, "Duplicate", "Profile"));
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    private async Task DeleteUsersAsync(params Guid[] userIds)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        await db.Users.Where(x => userIds.Contains(x.Id)).ExecuteDeleteAsync();
    }

    private sealed record AuthenticationDocument(string AccessToken, Guid UserId);
    private sealed record ProfileDocument(string FirstName, string LastName);
}
