using Microsoft.EntityFrameworkCore;
using Resumade.Api.Models;

namespace Resumade.Api.Data
{
    public class ResumadeDbContext : DbContext
    {
        public ResumadeDbContext(DbContextOptions<ResumadeDbContext> options)
            :base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<AccountActionToken> AccountActionTokens => Set<AccountActionToken>();
        public DbSet<Resume> Resumes => Set<Resume>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.SecurityVersion)
                .IsConcurrencyToken();

            modelBuilder.Entity<AccountActionToken>(token =>
            {
                token.HasKey(t => t.Hash);
                token.Property(t => t.Hash).HasMaxLength(64);
                token.HasIndex(t => new { t.UserId, t.Purpose, t.CreatedAtUtc });
                token.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(t => t.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Resume>()
                .HasIndex(r => new { r.UserId, r.UpdatedAt, r.Id });

            modelBuilder.Entity<Resume>()
                .HasOne(r => r.User)
                .WithMany(u => u.Resumes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
