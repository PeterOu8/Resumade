using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Resumade.Api.Infrastructure.Persistence;

namespace Resumade.Api.Tests;

public sealed class ResumadeApiFactory : WebApplicationFactory<Program>
{
    private const string TestSigningKey = "resumade-integration-tests-only-signing-key-64-characters-long-value";
    private readonly string _connectionString;
    public string StorageRoot { get; } = Path.Combine(Path.GetTempPath(), "resumade-upload-tests", Guid.NewGuid().ToString("N"));

    public ResumadeApiFactory()
    {
        using var designTimeContext = new ResumadeDbContextFactory().CreateDbContext([]);
        _connectionString = designTimeContext.Database.GetConnectionString()
            ?? throw new InvalidOperationException("Integration test database is not configured.");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Windows Event Log is not writable in sandboxed test runners.
        builder.ConfigureLogging(logging => logging.ClearProviders().AddConsole());
        builder.ConfigureServices(services => services.AddDataProtection().UseEphemeralDataProtectionProvider());
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:ResumadeDatabase", _connectionString);
        builder.UseSetting("Jwt:Issuer", "Resumade.Api.Tests");
        builder.UseSetting("Jwt:Audience", "Resumade.Api.Tests");
        builder.UseSetting("Jwt:SigningKey", TestSigningKey);
        builder.UseSetting("Jwt:AccessTokenLifetimeMinutes", "5");
        builder.UseSetting("FileStorage:RootPath", StorageRoot);
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<ResumadeDbContext>().Database.Migrate();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing && Directory.Exists(StorageRoot))
            Directory.Delete(StorageRoot, recursive: true);
    }
}
