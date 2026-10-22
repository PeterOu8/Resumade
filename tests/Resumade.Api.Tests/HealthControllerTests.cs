using System.Net;
using System.Text.Json;
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
}