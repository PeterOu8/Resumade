using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Domain.Resumes;

namespace Resumade.Infrastructure.Persistence.Configurations;

public sealed class ExperienceConfiguration : IEntityTypeConfiguration<Experience>
{
    public void Configure(EntityTypeBuilder<Experience> builder)
    {
        builder.ToTable("experiences", table =>
        {
            table.HasCheckConstraint("CK_experiences_sort_order", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_experiences_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
            table.HasCheckConstraint("CK_experiences_current_end_date", "NOT \"IsCurrent\" OR \"EndDate\" IS NULL");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Company).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Position).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.StartDate).HasConversion<YearMonthConverter>();
        builder.Property(x => x.EndDate).HasConversion<YearMonthConverter>();
        builder.HasIndex(x => x.ResumeVersionId);
    }
}
