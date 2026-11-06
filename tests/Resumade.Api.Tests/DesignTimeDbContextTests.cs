using Microsoft.EntityFrameworkCore;
using Resumade.Api.Data;
using Resumade.Api.Models;
using Xunit;

namespace Resumade.Api.Tests;

[CollectionDefinition("Design-time configuration", DisableParallelization = true)]
public sealed class DesignTimeConfigurationCollection;

[Collection("Design-time configuration")]
public sealed class DesignTimeDbContextTests
{
    [Theory]
    [InlineData(" ", null)]
    [InlineData("Host=localhost;Database=design_time_only", "Host=localhost;Database=design_time_only")]
    public void FactoryBuildsTheModelWithoutRequiringDatabaseAccess(string configuration, string? expected)
    {
        const string variable = "ConnectionStrings__ResumadeDatabase";
        var previous = Environment.GetEnvironmentVariable(variable);
        try
        {
            Environment.SetEnvironmentVariable(variable, configuration);
            using var context = new ResumadeDbContextFactory().CreateDbContext([]);

            Assert.Equal("Npgsql.EntityFrameworkCore.PostgreSQL", context.Database.ProviderName);
            Assert.Equal(expected, context.Database.GetConnectionString());
            Assert.NotNull(context.Model.FindEntityType(typeof(Resume))?.FindProperty(nameof(Resume.PresentationJson)));
        }
        finally
        {
            Environment.SetEnvironmentVariable(variable, previous);
        }
    }
}
