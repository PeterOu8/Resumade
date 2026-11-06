using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using Resumade.Api.Data;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Models;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ResumeOwnershipTests
{
    private const string SigningKey = "resumade-ownership-tests-signing-key-only";
    private const string Issuer = "resumade-ownership-tests";

    [Fact]
    public async Task SavedResumeEndpoints_UseTheAuthenticatedOwner()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var application = new WebApplicationFactory<Program>();
        await using var factory = application.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Jwt:Key", SigningKey);
            builder.UseSetting("Jwt:Issuer", Issuer);
            builder.UseSetting("Jwt:Audience", Issuer);
            builder.UseSetting("ConnectionStrings:ResumadeDatabase", "Host=localhost;Database=unused");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IDbContextOptionsConfiguration<ResumadeDbContext>>();
                services.AddDbContext<ResumadeDbContext>(options => options.UseSqlite(connection));
            });
        });
        var owner = new User { Email = "owner@example.test", EmailVerifiedAtUtc = DateTime.UtcNow };
        var other = new User { Email = "other@example.test", EmailVerifiedAtUtc = DateTime.UtcNow };
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
            await db.Database.EnsureCreatedAsync();
            db.Users.AddRange(owner, other);
            await db.SaveChangesAsync();
        }

        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        const string path = "/api/resumes";
        using var anonymous = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);

        client.DefaultRequestHeaders.Authorization = Bearer(owner);
        using var presentationDocument = JsonDocument.Parse("""{"version":2,"settings":{"style":"modern"}}""");
        using var created = await client.PostAsJsonAsync(path, new
        {
            Title = "Original resume",
            Content = new ResumeContentDto(),
            UserId = other.Id,
            Presentation = presentationDocument.RootElement
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var resume = Assert.IsType<ResumeDto>(await created.Content.ReadFromJsonAsync<ResumeDto>());
        Assert.Equal("modern", resume.Presentation!.Value.GetProperty("settings").GetProperty("style").GetString());
        var resumePath = $"{path}/{resume.Id}";
        var change = new SaveResumeDto { Title = "Updated resume", Content = new ResumeContentDto() };

        client.DefaultRequestHeaders.Authorization = Bearer(other);
        Assert.Empty((await client.GetFromJsonAsync<ResumePageDto>(path))!.Items);
        using var otherRead = await client.GetAsync(resumePath);
        using var otherWrite = await client.PutAsJsonAsync(resumePath, change);
        using var otherDelete = await client.DeleteAsync(resumePath);
        Assert.Equal(HttpStatusCode.NotFound, otherRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherWrite.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDelete.StatusCode);

        client.DefaultRequestHeaders.Authorization = Bearer(owner);
        Assert.Equal(resume.Id, Assert.Single((await client.GetFromJsonAsync<ResumePageDto>(path))!.Items).Id);
        foreach (var content in new[]
        {
            """{"experience":[null]}""",
            """{"experience":[{"bullets":[null]}]}""",
            """{"keySkills":null}""",
            """{"profile":null}""",
            """{"profile":{"fullName":null}}"""
        })
        {
            using var json = JsonDocument.Parse(content);
            var invalid = new { Title = "Invalid resume", Content = json.RootElement };
            using var invalidCreate = await client.PostAsJsonAsync(path, invalid);
            using var invalidUpdate = await client.PutAsJsonAsync(resumePath, invalid);
            Assert.Equal(HttpStatusCode.BadRequest, invalidCreate.StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, invalidUpdate.StatusCode);
        }
        Assert.Single((await client.GetFromJsonAsync<ResumePageDto>(path))!.Items);
        var original = await client.GetFromJsonAsync<ResumeDto>(resumePath);
        Assert.Equal("Original resume", original?.Title);
        using var updated = await client.PutAsJsonAsync(resumePath, change);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var updatedResume = await updated.Content.ReadFromJsonAsync<ResumeDto>();
        Assert.Equal(change.Title, updatedResume?.Title);
        Assert.Equal("modern", updatedResume!.Presentation!.Value.GetProperty("settings").GetProperty("style").GetString());
        using var changedPresentation = JsonDocument.Parse("""{"version":2,"settings":{"style":"classic"}}""");
        change.Presentation = changedPresentation.RootElement;
        using var updatedLayout = await client.PutAsJsonAsync(resumePath, change);
        Assert.Equal(HttpStatusCode.OK, updatedLayout.StatusCode);
        Assert.Equal("classic", (await client.GetFromJsonAsync<ResumeDto>(resumePath))!
            .Presentation!.Value.GetProperty("settings").GetProperty("style").GetString());
        using var deleted = await client.DeleteAsync(resumePath);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<ResumePageDto>(path))!.Items);

        var timestamp = DateTime.UtcNow;
        var older = new Resume { UserId = owner.Id, UpdatedAt = timestamp.AddMinutes(-1) };
        var tied = new Resume { UserId = owner.Id, UpdatedAt = timestamp };
        var newest = new Resume { UserId = owner.Id, UpdatedAt = timestamp, ContentJson = "null" };
        if (newest.Id.CompareTo(tied.Id) < 0)
            (newest.Id, tied.Id) = (tied.Id, newest.Id);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
            db.Resumes.AddRange(older, tied, newest, new Resume { UserId = other.Id, UpdatedAt = timestamp.AddMinutes(1) });
            await db.SaveChangesAsync();
        }

        using var firstJson = await client.GetFromJsonAsync<JsonDocument>($"{path}?limit=1");
        var first = firstJson!.RootElement.Deserialize<ResumePageDto>(new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
        Assert.Equal(newest.Id, Assert.Single(first.Items).Id);
        Assert.False(firstJson.RootElement.GetProperty("items")[0].TryGetProperty("content", out _));
        var nextCursor = Assert.IsType<string>(first.NextCursor);
        var second = await client.GetFromJsonAsync<ResumePageDto>($"{path}?limit=2&cursor={Uri.EscapeDataString(nextCursor)}");
        Assert.Equal(new[] { tied.Id, older.Id }, second!.Items.Select(item => item.Id));
        Assert.Null(second.NextCursor);

        using var badCursor = await client.GetAsync($"{path}?cursor=invalid");
        using var negativeCursor = await client.GetAsync(
            $"{path}?cursor={Uri.EscapeDataString($"-1:{Guid.Empty:D}")}");
        using var badLimit = await client.GetAsync($"{path}?limit=9");
        Assert.Equal(HttpStatusCode.BadRequest, badCursor.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, negativeCursor.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badLimit.StatusCode);

        var draft = new SaveResumeDto { Title = "New resume", Content = new ResumeContentDto() };
        for (var count = 3; count < 16; count++)
        {
            using var save = await client.PostAsJsonAsync(path, draft);
            Assert.Equal(HttpStatusCode.Created, save.StatusCode);
        }
        using var overQuota = await client.PostAsJsonAsync(path, draft);
        Assert.Equal(HttpStatusCode.Conflict, overQuota.StatusCode);
        using var problem = await overQuota.Content.ReadFromJsonAsync<JsonDocument>();
        Assert.Equal("You can save up to 16 resumes.", problem!.RootElement.GetProperty("detail").GetString());

        using var editAtQuota = await client.PutAsJsonAsync($"{path}/{tied.Id}", change);
        Assert.Equal(HttpStatusCode.OK, editAtQuota.StatusCode);
        using var freeSlot = await client.DeleteAsync($"{path}/{older.Id}");
        Assert.Equal(HttpStatusCode.NoContent, freeSlot.StatusCode);
        using var saveAgain = await client.PostAsJsonAsync(path, draft);
        Assert.Equal(HttpStatusCode.Created, saveAgain.StatusCode);
    }

    private static AuthenticationHeaderValue Bearer(User user)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(Issuer, Issuer,
            [new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim("sv", "0")],
            expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: credentials);
        return new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));
    }
}
