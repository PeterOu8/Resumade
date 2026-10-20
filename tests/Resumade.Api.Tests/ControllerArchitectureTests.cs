using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Resumade.Api.Infrastructure.Persistence;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ControllerArchitectureTests(ResumadeApiFactory factory) : IClassFixture<ResumadeApiFactory>
{
    [Fact]
    public async Task Health_preserves_the_public_response()
    {
        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(2, json.RootElement.EnumerateObject().Count());
        Assert.Equal("healthy", json.RootElement.GetProperty("status").GetString());
        Assert.Equal("Resumade API", json.RootElement.GetProperty("service").GetString());
    }

    [Fact]
    public void All_original_API_routes_are_unique_controller_actions()
    {
        using var client = factory.CreateClient();
        var endpoints = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>()
            .Where(endpoint => endpoint.RoutePattern.RawText?.StartsWith("api/", StringComparison.OrdinalIgnoreCase) == true)
            .ToArray();

        var routes = endpoints.SelectMany(endpoint =>
        {
            Assert.NotNull(endpoint.Metadata.GetMetadata<ControllerActionDescriptor>());
            var methods = endpoint.Metadata.GetMetadata<HttpMethodMetadata>();
            Assert.NotNull(methods);
            return methods.HttpMethods.Select(method => $"{method} /{endpoint.RoutePattern.RawText!.ToLowerInvariant()}");
        }).Order().ToArray();

        string[] expected =
        [
            "GET /api/auth/me", "GET /api/health", "GET /api/profile", "GET /api/resumes",
            "GET /api/resumes/{resumeid:guid}", "POST /api/auth/login", "POST /api/auth/register",
            "POST /api/resumes", "POST /api/resumes/{resumeid:guid}/document", "PUT /api/profile"
        ];
        Assert.Equal(expected.Order(), routes);
        Assert.Equal(routes.Length, routes.Distinct().Count());
    }

    [Fact]
    public void Every_controller_resolves_with_its_registered_dependencies()
    {
        using var scope = factory.Services.CreateScope();
        var actions = factory.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .Select(endpoint => endpoint.Metadata.GetMetadata<ControllerActionDescriptor>())
            .OfType<ControllerActionDescriptor>()
            .Select(action => action.ControllerTypeInfo.AsType()).Distinct().ToArray();

        Assert.Equal(5, actions.Length);
        foreach (var controllerType in actions)
            Assert.NotNull(ActivatorUtilities.CreateInstance(scope.ServiceProvider, controllerType));
    }

    [Fact]
    public void Consolidation_preserves_migration_history_and_matches_the_model_snapshot()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();

        Assert.False(db.Database.HasPendingModelChanges());
        Assert.Equal(new[]
        {
            "20260911130012_InitialCreate", "20260913153516_AddIdentityUsers",
            "20260913155321_AddUserProfiles", "20260913161602_AddResumeDomain",
            "20260913164521_AddResumeDocuments"
        }, db.Database.GetMigrations());
    }
}
