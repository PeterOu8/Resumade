using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence.Configurations;

public sealed class ResumeVersionConfiguration : IEntityTypeConfiguration<ResumeVersion>
{
    public void Configure(EntityTypeBuilder<ResumeVersion> builder)
    {
        builder.ToTable("resume_versions", table =>
            table.HasCheckConstraint("CK_resume_versions_version_number", "\"VersionNumber\" >= 1"));
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200);
        builder.Property(x => x.ProfessionalSummary).HasMaxLength(4000);
        builder.Property(x => x.SourceType).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.HasIndex(x => new { x.ResumeId, x.VersionNumber }).IsUnique();

        builder.HasMany(x => x.Experiences).WithOne().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Education).WithOne().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Projects).WithOne().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Skills).WithOne().HasForeignKey(x => x.ResumeVersionId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Experiences).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(x => x.Education).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(x => x.Projects).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(x => x.Skills).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
