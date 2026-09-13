using Microsoft.EntityFrameworkCore;
using Resumade.Domain.Common;
using Resumade.Domain.Identity;
using Resumade.Domain.Profiles;
using Resumade.Domain.Resumes;

namespace Resumade.Infrastructure.Persistence
{
    public sealed class ResumadeDbContext(
        DbContextOptions<ResumadeDbContext> options)
        : DbContext(options)
    {
        public DbSet<SystemRecord> SystemRecords =>
            Set<SystemRecord>();
        public DbSet<User> Users => Set<User>();
        public DbSet<UserProfile> Profiles => Set<UserProfile>();
        public DbSet<Resume> Resumes => Set<Resume>();
        public DbSet<ResumeVersion> ResumeVersions => Set<ResumeVersion>();
        public DbSet<Experience> Experiences => Set<Experience>();
        public DbSet<Education> Education => Set<Education>();
        public DbSet<Project> Projects => Set<Project>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<ResumeDocument> ResumeDocuments => Set<ResumeDocument>();

        protected override void OnModelCreating(ModelBuilder modelBuilder){
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ResumadeDbContext).Assembly);

        }
    }
}

