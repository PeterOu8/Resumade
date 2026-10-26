using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Resumade.Api.Data;
using Resumade.Api.Models;
using Resumade.Api.Models.Dtos;
using Resumade.Api.Services;
using Xunit;

namespace Resumade.Api.Tests;

public class ResumeServiceTests
{
    [Fact]
    public async Task CreateReadUpdateAndList_PreserveStructuredContentAndOwnership()
    {
        var options = new DbContextOptionsBuilder<ResumadeDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;
        await using var context = new ResumadeDbContext(options);
        await context.Database.OpenConnectionAsync();
        await context.Database.EnsureCreatedAsync();

        var user = new User { Email = "alice@example.com", DisplayName = "Alice" };
        context.Users.Add(user);
        await context.SaveChangesAsync();
        var service = new ResumeService(context);
        var content = new ResumeContentDto
        {
            FullName = "Alice Nguyen",
            Email = user.Email,
            Phone = "0400 000 000",
            Location = "Melbourne, VIC",
            Summary = "Graduate developer",
            KeySkills = new() { "C#", "PostgreSQL" },
            Experience = new()
            {
                new() { Company = "Example", Title = "Intern", Dates = "2025",
                    Bullets = new() { "Built an API." } }
            },
            Projects = new()
            {
                new() { Title = "Resumade", TechStack = new() { "ASP.NET Core" },
                    Bullets = new() { "Implemented resume CRUD." } }
            },
            Education = new()
            {
                new() { School = "Example University", Degree = "Bachelor of IT",
                    Awards = new() { "Dean's List" } }
            }
        };

        var created = await service.CreateResumeAsync(new CreateResumeDto
        {
            Title = " Junior Developer ", Content = content
        }, user.Id);
        Assert.Equal("Junior Developer", created.Title);
        Assert.Equal("Graduate developer", created.Content.Summary);

        // Force subsequent reads to load the saved database record.
        context.ChangeTracker.Clear();
        var loaded = await service.GetResumeByIdAsync(created.Id, user.Id);
        Assert.NotNull(loaded);
        Assert.Equal("Alice Nguyen", loaded.Content.FullName);
        Assert.Equal(user.Email, loaded.Content.Email);
        Assert.Equal("0400 000 000", loaded.Content.Phone);
        Assert.Equal("Melbourne, VIC", loaded.Content.Location);
        Assert.Equal(new[] { "C#", "PostgreSQL" }, loaded.Content.KeySkills);
        Assert.Equal("Built an API.", Assert.Single(loaded.Content.Experience).Bullets[0]);
        Assert.Equal("ASP.NET Core", Assert.Single(loaded.Content.Projects).TechStack[0]);
        Assert.Equal("Dean's List", Assert.Single(loaded.Content.Education).Awards[0]);

        var otherUserId = Guid.NewGuid();
        Assert.Null(await service.GetResumeByIdAsync(created.Id, otherUserId));
        Assert.Null(await service.UpdateResumeAsync(created.Id,
            new UpdateResumeDto { Title = "Not allowed", Content = content }, otherUserId));
        Assert.Empty(await service.GetUserResumesAsync(otherUserId));

        content.Summary = "Developer with ASP.NET Core experience";
        var updated = await service.UpdateResumeAsync(created.Id, new UpdateResumeDto
        {
            Title = " Updated Resume ", Content = content
        }, user.Id);
        Assert.NotNull(updated);
        Assert.Equal("Updated Resume", updated.Title);
        Assert.Equal(content.Summary, updated.Content.Summary);
        Assert.Equal(created.CreatedAt, updated.CreatedAt);

        context.ChangeTracker.Clear();
        var reloaded = await service.GetResumeByIdAsync(created.Id, user.Id);
        Assert.NotNull(reloaded);
        Assert.Equal(content.Summary, reloaded.Content.Summary);
        var listed = Assert.Single(await service.GetUserResumesAsync(user.Id));
        Assert.Equal(created.Id, listed.Id);
        Assert.Equal(content.Summary, listed.Content.Summary);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void RequestValidation_AcceptsTypedContentAndRejectsNull(bool update)
    {
        object request = update
            ? new UpdateResumeDto { Title = "Resume", Content = new() }
            : new CreateResumeDto { Title = "Resume", Content = new() };
        Assert.True(Validator.TryValidateObject(request,
            new ValidationContext(request), new List<ValidationResult>(), true));

        if (request is UpdateResumeDto updateRequest)
            updateRequest.Content = null!;
        else
            ((CreateResumeDto)request).Content = null!;

        Assert.False(Validator.TryValidateObject(request,
            new ValidationContext(request), new List<ValidationResult>(), true));
    }
}
