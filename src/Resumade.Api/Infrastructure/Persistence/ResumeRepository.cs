using Microsoft.EntityFrameworkCore;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence;

public sealed class ResumeRepository(ResumadeDbContext dbContext) : IResumeRepository
{
    public Task AddAsync(Resume resume, CancellationToken cancellationToken) =>
        dbContext.Resumes.AddAsync(resume, cancellationToken).AsTask();

    public async Task<IReadOnlyList<Resume>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        await dbContext.Resumes.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Include(x => x.Versions)
            .OrderByDescending(x => x.UpdatedAt)
            .ToArrayAsync(cancellationToken);

    public Task<Resume?> FindByIdForUserAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken) =>
        dbContext.Resumes.AsNoTracking()
            .Where(x => x.Id == resumeId && x.UserId == userId)
            .Include(x => x.Versions).ThenInclude(x => x.Experiences)
            .Include(x => x.Versions).ThenInclude(x => x.Education)
            .Include(x => x.Versions).ThenInclude(x => x.Projects)
            .Include(x => x.Versions).ThenInclude(x => x.Skills)
            .AsSplitQuery()
            .SingleOrDefaultAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);
}
