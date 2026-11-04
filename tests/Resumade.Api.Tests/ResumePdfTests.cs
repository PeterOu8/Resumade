using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ResumePdfTests
{
    [Fact]
    public async Task DownloadDraftPdf_ReturnsServiceUnavailableWhenRendererIsBusy()
    {
        await using var application = new WebApplicationFactory<Program>();
        await using var factory = application.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Jwt:Key", "resumade-pdf-test-key-with-at-least-32-characters");
            builder.UseSetting("ConnectionStrings:ResumadeDatabase", "Host=localhost;Database=unused");
            builder.UseSetting("Pdf:MaxConcurrentRenders", "0");
        });
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("/api/resumes/pdf", new
        {
            Title = "Guest Resume",
            Html = "<h1>Guest Candidate</h1>"
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal(TimeSpan.FromSeconds(5), response.Headers.RetryAfter?.Delta);
    }

    [Fact]
    public async Task DownloadDraftPdf_RendersAnonymousPreview()
    {
        await using var application = new WebApplicationFactory<Program>();
        await using var factory = application.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Jwt:Key", "resumade-pdf-test-key-with-at-least-32-characters");
            builder.UseSetting("Jwt:Issuer", "pdf-tests");
            builder.UseSetting("Jwt:Audience", "pdf-tests");
            builder.UseSetting("ConnectionStrings:ResumadeDatabase", "Host=localhost;Database=unused");
        });
        using var client = factory.CreateClient();

        using var invalid = await client.PostAsJsonAsync("/api/resumes/pdf", new { Title = "Guest Resume" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        using var response = await client.PostAsJsonAsync("/api/resumes/pdf", new
        {
            Title = "Guest Resume",
            Html = """
                <style>@page { size: letter; margin: 12.7mm; } h1 { color: #3558c8; }</style>
                <h1>Guest Candidate</h1><p>This is the current unsaved draft.</p>
                """,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("attachment", response.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Equal("Guest Resume.pdf", response.Content.Headers.ContentDisposition?.FileNameStar);
        Assert.True(response.Headers.CacheControl?.NoStore);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.AsSpan().StartsWith("%PDF-"u8));
    }
}
