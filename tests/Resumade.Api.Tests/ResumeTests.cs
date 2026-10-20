using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Resumade.Api.Models.Entities.Resumes;
using Resumade.Api.Infrastructure.Persistence;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ResumeTests(ResumadeApiFactory factory) : IClassFixture<ResumadeApiFactory>
{
    [Fact]
    public async Task Resume_endpoints_reject_anonymous_requests()
    {
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/resumes")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/resumes", new { name = "Anonymous resume" })).StatusCode);
    }

    [Fact]
    public async Task Resume_aggregate_persists_structured_children_and_enforces_ownership_and_versions()
    {
        using var clientA = factory.CreateClient();
        using var clientB = factory.CreateClient();
        var userA = await RegisterAsync(clientA);
        var userB = await RegisterAsync(clientB);

        try
        {
            Authorize(clientA, userA.AccessToken);
            Authorize(clientB, userB.AccessToken);

            var resumeA = await CreateResumeAsync(clientA, "Backend Engineer Resume");
            var resumeB = await CreateResumeAsync(clientB, "Full Stack Resume");

            Assert.Equal(HttpStatusCode.OK, (await clientA.GetAsync($"/api/resumes/{resumeA.ResumeId}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await clientB.GetAsync($"/api/resumes/{resumeA.ResumeId}")).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, (await clientA.GetAsync($"/api/resumes/{resumeB.ResumeId}")).StatusCode);

            var listA = await clientA.GetFromJsonAsync<JsonElement>("/api/resumes");
            var listB = await clientB.GetFromJsonAsync<JsonElement>("/api/resumes");
            Assert.Single(listA.EnumerateArray());
            Assert.Single(listB.EnumerateArray());
            Assert.Equal(resumeA.ResumeId, listA[0].GetProperty("id").GetGuid());
            Assert.Equal(resumeB.ResumeId, listB[0].GetProperty("id").GetGuid());

            await AddStructuredContentAsync(resumeA.ResumeId, resumeA.VersionId);

            var detail = await clientA.GetFromJsonAsync<JsonElement>($"/api/resumes/{resumeA.ResumeId}");
            var current = detail.GetProperty("currentVersion");
            Assert.Equal(1, current.GetProperty("versionNumber").GetInt32());
            Assert.Equal("Manual", current.GetProperty("sourceType").GetString());
            Assert.Single(current.GetProperty("experiences").EnumerateArray());
            Assert.Single(current.GetProperty("education").EnumerateArray());
            Assert.Single(current.GetProperty("projects").EnumerateArray());
            Assert.Single(current.GetProperty("skills").EnumerateArray());
            Assert.Equal(2024, current.GetProperty("experiences")[0].GetProperty("startDate").GetProperty("year").GetInt32());

            await AssertDuplicateVersionRejectedAsync(resumeA.ResumeId);
        }
        finally
        {
            await DeleteUsersAsync(userA.UserId, userB.UserId);
        }
    }

    private const string Password = "A-valid-test-password-123!";

    private async Task AddStructuredContentAsync(Guid resumeId, Guid versionId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        var resume = await db.Resumes.Include(x => x.Versions).SingleAsync(x => x.Id == resumeId);
        var version = Assert.Single(resume.Versions);
        Assert.Equal(versionId, version.Id);
        Assert.Equal(resumeId, version.ResumeId);

        var experience = new Experience(Guid.NewGuid(), version.Id, "Resumade", "Software Engineer",
            "Melbourne", new YearMonth(2024, 2), null, true, "Built reliable APIs.", 0);
        var education = new Education(Guid.NewGuid(), version.Id, "Example University", "BSc",
            "Computer Science", "Melbourne", new YearMonth(2020, 2), new YearMonth(2023, 11), null, 0);
        var project = new Resumade.Api.Models.Entities.Resumes.Project(Guid.NewGuid(), version.Id, "Resumade",
            "Career preparation SaaS", "https://example.com", new YearMonth(2025, 1), null, 0);
        var skill = new Skill(Guid.NewGuid(), version.Id, ".NET", "Backend", null, 2.5m, 0);

        version.AddExperience(experience);
        version.AddEducation(education);
        version.AddProject(project);
        version.AddSkill(skill);
        db.AddRange(experience, education, project, skill);

        await db.SaveChangesAsync();
    }

    private async Task AssertDuplicateVersionRejectedAsync(Guid resumeId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        db.ResumeVersions.Add(new ResumeVersion(Guid.NewGuid(), resumeId, 1, null, null, ResumeSourceType.Tailored));
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    private static async Task<CreatedResume> CreateResumeAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync("/api/resumes", new { name });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return new CreatedResume(
            json.RootElement.GetProperty("id").GetGuid(),
            json.RootElement.GetProperty("currentVersion").GetProperty("id").GetGuid());
    }

    private static async Task<AuthenticatedUser> RegisterAsync(HttpClient client)
    {
        var email = $"resume-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = Password });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return new AuthenticatedUser(
            json.RootElement.GetProperty("accessToken").GetString()!,
            json.RootElement.GetProperty("user").GetProperty("id").GetGuid());
    }

    private static void Authorize(HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private async Task DeleteUsersAsync(params Guid[] userIds)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        await db.Users.Where(x => userIds.Contains(x.Id)).ExecuteDeleteAsync();
    }

    private sealed record AuthenticatedUser(string AccessToken, Guid UserId);
    private sealed record CreatedResume(Guid ResumeId, Guid VersionId);
}
