using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Api.Models.Entities.Common;

namespace Resumade.Api.Infrastructure.Persistence.Configurations;

public sealed class SystemRecordConfiguration
    : IEntityTypeConfiguration<SystemRecord>
{
    public void Configure(
        EntityTypeBuilder<SystemRecord> builder)
    {
        builder.ToTable("system_records");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Created)
            .IsRequired();
    }
}