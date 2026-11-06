using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Resumade.Api.Data;

internal sealed class ResumadeDbContextFactory :
    IDesignTimeDbContextFactory<ResumadeDbContext>
{
    public ResumadeDbContext CreateDbContext(string[] args)
    {
        var environment =
            Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ??
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ??
            Environments.Production;
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddUserSecrets(typeof(ResumadeDbContextFactory).Assembly, optional: true)
            .AddEnvironmentVariables()
            .Build();
        var connectionString = configuration.GetConnectionString("ResumadeDatabase");

        // Bundling needs provider metadata only; migration execution supplies its connection separately.
        var options = new DbContextOptionsBuilder<ResumadeDbContext>()
            .UseNpgsql(string.IsNullOrWhiteSpace(connectionString) ? null : connectionString)
            .Options;

        return new ResumadeDbContext(options);
    }
}
