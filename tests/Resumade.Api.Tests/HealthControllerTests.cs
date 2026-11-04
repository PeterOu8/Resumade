using System.Net;
using System.Text.Json;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class HealthControllerTests(
    WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetHealth_ReturnsExpectedResponse()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Assert.Equal(
            "application/json",
            response.Content.Headers.ContentType?.MediaType);

        var body = await response.Content.ReadAsStringAsync();

        using var json = JsonDocument.Parse(body);

        Assert.Equal(
            "healthy",
            json.RootElement.GetProperty("status").GetString());

        Assert.Equal(
            "Resumade API",
            json.RootElement.GetProperty("service").GetString());

        Assert.Equal(
            2,
            json.RootElement.EnumerateObject().Count());
    }

    [Fact]
    public async Task ParseRateLimit_RejectsRequestsAbovePerIpLimit()
    {
        using var client = factory.CreateClient();

        for (var requestNumber = 0; requestNumber < 20; requestNumber++)
        {
            using var allowed = await client.PostAsJsonAsync("/api/resumes/parse", Array.Empty<object>());
            Assert.NotEqual(HttpStatusCode.TooManyRequests, allowed.StatusCode);
        }

        using var rejected = await client.PostAsJsonAsync("/api/resumes/parse", Array.Empty<object>());

        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.NotNull(rejected.Headers.RetryAfter);
    }
}
