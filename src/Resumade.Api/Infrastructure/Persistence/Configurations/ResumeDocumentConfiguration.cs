using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence.Configurations;

public sealed class ResumeDocumentConfiguration : IEntityTypeConfiguration<ResumeDocument>
{
    public void Configure(EntityTypeBuilder<ResumeDocument> builder)
    {
        builder.ToTable("resume_documents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OriginalFileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.StorageKey).HasMaxLength(512).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(127).IsRequired();
        builder.Property(x => x.FileSize).IsRequired();
        builder.Property(x => x.UploadedAt).IsRequired();
        builder.HasIndex(x => x.ResumeId).IsUnique();
        builder.HasOne<Resume>().WithOne(x => x.Document).HasForeignKey<ResumeDocument>(x => x.ResumeId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.ToTable(table => table.HasCheckConstraint("CK_resume_documents_file_size", "\"FileSize\" > 0"));
    }
}
