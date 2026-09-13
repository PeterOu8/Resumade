using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Domain.Resumes;

namespace Resumade.Infrastructure.Persistence.Configurations;

public sealed class EducationConfiguration : IEntityTypeConfiguration<Education>
{
    public void Configure(EntityTypeBuilder<Education> builder)
    {
        builder.ToTable("education", table =>
        {
            table.HasCheckConstraint("CK_education_sort_order", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_education_date_range", "\"StartDate\" IS NULL OR \"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Institution).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Degree).HasMaxLength(200);
        builder.Property(x => x.FieldOfStudy).HasMaxLength(200);
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.StartDate).HasConversion<YearMonthConverter>();
        builder.Property(x => x.EndDate).HasConversion<YearMonthConverter>();
        builder.HasIndex(x => x.ResumeVersionId);
    }
}
