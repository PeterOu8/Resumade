using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects", table =>
        {
            table.HasCheckConstraint("CK_projects_sort_order", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_projects_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.Url).HasMaxLength(2048);
        builder.Property(x => x.StartDate).HasConversion<YearMonthConverter>();
        builder.Property(x => x.EndDate).HasConversion<YearMonthConverter>();
        builder.HasIndex(x => x.ResumeVersionId);
    }
}
