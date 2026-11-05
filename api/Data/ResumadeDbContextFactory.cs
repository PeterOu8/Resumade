using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Resumade.Api.Data;

internal sealed class ResumadeDbContextFactory :
    IDesignTimeDbContextFactory<ResumadeDbContext>
{
    public ResumadeDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__ResumadeDatabase") ??
            "Host=localhost;Database=resumade";

        var options = new DbContextOptionsBuilder<ResumadeDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ResumadeDbContext(options);
    }
}
