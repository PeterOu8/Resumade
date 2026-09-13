using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Domain.Resumes;

namespace Resumade.Infrastructure.Persistence.Configurations;

public sealed class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.ToTable("skills", table =>
        {
            table.HasCheckConstraint("CK_skills_sort_order", "\"SortOrder\" >= 0");
            table.HasCheckConstraint("CK_skills_years_experience", "\"YearsExperience\" IS NULL OR \"YearsExperience\" >= 0");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(100);
        builder.Property(x => x.Proficiency).HasMaxLength(100);
        builder.Property(x => x.YearsExperience).HasPrecision(4, 1);
        builder.HasIndex(x => x.ResumeVersionId);
    }
}
