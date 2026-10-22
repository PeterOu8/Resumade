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
        public DbSet<Resume> Resumes => Set<Resume>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Resume>()
                .HasOne(r => r.User)
                .WithMany(u => u.Resumes)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
