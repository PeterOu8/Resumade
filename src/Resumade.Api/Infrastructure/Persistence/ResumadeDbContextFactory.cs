using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Resumade.Api.Infrastructure.Persistence;

// EF tooling needs the model, not application secrets. Runtime configuration remains in the API host.
public sealed class ResumadeDbContextFactory : IDesignTimeDbContextFactory<ResumadeDbContext>
{
    public ResumadeDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile(Path.Combine(AppContext.BaseDirectory, "appsettings.json"), optional: true)
            .AddUserSecrets<ResumadeDbContextFactory>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("ResumadeDatabase")
            ?? "Host=localhost;Database=resumade;Username=postgres;Password=postgres";

        var options = new DbContextOptionsBuilder<ResumadeDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ResumadeDbContext(options);
    }
}
