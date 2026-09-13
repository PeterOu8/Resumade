using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Resumade.Domain.Identity;
using Resumade.Domain.Profiles;

namespace Resumade.Infrastructure.Persistence.Configurations;

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("profiles");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Headline).HasMaxLength(200);
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(40);
        builder.Property(x => x.LinkedInUrl).HasMaxLength(2048);
        builder.Property(x => x.GitHubUrl).HasMaxLength(2048);
        builder.Property(x => x.PortfolioUrl).HasMaxLength(2048);
        builder.Property(x => x.Summary).HasMaxLength(4000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt).IsRequired();

        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasOne<User>()
            .WithOne()
            .HasForeignKey<UserProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
