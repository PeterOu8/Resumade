using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
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
        using var created = await client.PostAsJsonAsync(path, new
        {
            Title = "Original resume",
            Content = new ResumeContentDto(),
            UserId = other.Id
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var resume = Assert.IsType<ResumeDto>(await created.Content.ReadFromJsonAsync<ResumeDto>());
        var resumePath = $"{path}/{resume.Id}";
        var change = new UpdateResumeDto { Title = "Updated resume", Content = new ResumeContentDto() };

        client.DefaultRequestHeaders.Authorization = Bearer(other);
        Assert.Empty((await client.GetFromJsonAsync<ResumeDto[]>(path))!);
        using var otherRead = await client.GetAsync(resumePath);
        using var otherWrite = await client.PutAsJsonAsync(resumePath, change);
        using var otherDelete = await client.DeleteAsync(resumePath);
        Assert.Equal(HttpStatusCode.NotFound, otherRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherWrite.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDelete.StatusCode);

        client.DefaultRequestHeaders.Authorization = Bearer(owner);
        Assert.Equal(resume.Id, Assert.Single((await client.GetFromJsonAsync<ResumeDto[]>(path))!).Id);
        var original = await client.GetFromJsonAsync<ResumeDto>(resumePath);
        Assert.Equal("Original resume", original?.Title);
        using var updated = await client.PutAsJsonAsync(resumePath, change);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal(change.Title, (await updated.Content.ReadFromJsonAsync<ResumeDto>())?.Title);
        using var deleted = await client.DeleteAsync(resumePath);
        Assert.Equal(HttpStatusCode.NoContent, deleted.StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<ResumeDto[]>(path))!);
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
