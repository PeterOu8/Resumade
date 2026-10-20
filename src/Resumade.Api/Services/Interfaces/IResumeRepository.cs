using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Services.Interfaces;

public interface IResumeRepository
{
    Task AddAsync(Resume resume, CancellationToken cancellationToken);
    Task<IReadOnlyList<Resume>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<Resume?> FindByIdForUserAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
