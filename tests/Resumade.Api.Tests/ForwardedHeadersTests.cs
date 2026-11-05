using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ForwardedHeadersTests
{
    private static readonly string ProxyToken = new('a', 64);

    [Fact]
    public async Task TrustedProxy_UsesForwardedClientForRateLimiting()
    {
        await using var factory = CreateFactory("127.0.0.1");
        using var client = factory.CreateClient();

        for (var requestNumber = 0; requestNumber < 5; requestNumber++)
            Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, "203.0.113.1"));

        for (var requestNumber = 0; requestNumber < 5; requestNumber++)
            Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, "203.0.113.2"));
    }

    [Fact]
    public async Task UntrustedProxy_IgnoresForwardedClientForRateLimiting()
    {
        await using var factory = CreateFactory("10.0.0.10");
        using var client = factory.CreateClient();

        for (var requestNumber = 0; requestNumber < 5; requestNumber++)
            Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, $"203.0.113.{requestNumber + 1}"));

        Assert.Equal(HttpStatusCode.TooManyRequests, await SignIn(client, "203.0.113.100"));
    }

    [Fact]
    public async Task AuthenticatedAssertions_SeparateClientsAndNormaliseMappedAddresses()
    {
        await using var factory = CreateFactory(proxyToken: ProxyToken);
        using var client = factory.CreateClient();

        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "203.0.113.1", token: ProxyToken));

        Assert.Equal(HttpStatusCode.TooManyRequests,
            await SignIn(client, clientIp: "::ffff:203.0.113.1", token: ProxyToken));
        Assert.Equal(HttpStatusCode.BadRequest,
            await SignIn(client, clientIp: "203.0.113.2", token: ProxyToken));
    }

    [Fact]
    public async Task InvalidAssertions_ShareTheConnectionQuota()
    {
        await using var factory = CreateFactory(proxyToken: ProxyToken);
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "203.0.113.1"));
        Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "203.0.113.2", token: new string('b', 64)));
        Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "203.0.113.3, 203.0.113.4", token: ProxyToken));
        Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "1234", token: ProxyToken));
        Assert.Equal(HttpStatusCode.BadRequest, await SignIn(client, clientIp: "203.0.113.5", token: $"{ProxyToken}, {ProxyToken}"));
        Assert.Equal(HttpStatusCode.TooManyRequests, await SignIn(client, clientIp: "203.0.113.6"));
    }

    private static WebApplicationFactory<Program> CreateFactory(string? knownProxy = null, string? proxyToken = null)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Jwt:Key", "resumade-proxy-test-key-with-at-least-32-characters");
            builder.UseSetting("ConnectionStrings:ResumadeDatabase", "Host=localhost;Database=unused");
            if (knownProxy is not null) builder.UseSetting("Proxy:KnownProxies:0", knownProxy);
            if (proxyToken is not null) builder.UseSetting("Proxy:WebToken", proxyToken);
            builder.ConfigureServices(services =>
                services.AddSingleton<IStartupFilter>(new RemoteIpStartupFilter(IPAddress.Loopback)));
        });
    }

    private static async Task<HttpStatusCode> SignIn(
        HttpClient client, string? forwardedFor = null, string? clientIp = null, string? token = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/signin")
        {
            // Admitted requests stop at model validation before the database lookup.
            Content = JsonContent.Create(new { Email = "invalid@example.test" })
        };
        if (forwardedFor is not null) request.Headers.Add("X-Forwarded-For", forwardedFor);
        if (clientIp is not null) request.Headers.Add("X-Resumade-Client-IP", clientIp);
        if (token is not null) request.Headers.Add("X-Resumade-Proxy-Token", token);
        using var response = await client.SendAsync(request);
        if (response.StatusCode == HttpStatusCode.TooManyRequests)
            Assert.True(response.Headers.RetryAfter?.Delta > TimeSpan.Zero);

        return response.StatusCode;
    }

    private sealed class RemoteIpStartupFilter(IPAddress remoteIpAddress) : IStartupFilter
    {
        public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
        {
            return app =>
            {
                app.Use((context, following) =>
                {
                    context.Connection.RemoteIpAddress = remoteIpAddress;
                    return following();
                });
                next(app);
            };
        }
    }
}
