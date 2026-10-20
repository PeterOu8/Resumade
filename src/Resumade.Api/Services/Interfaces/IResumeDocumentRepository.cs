using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Services.Interfaces;

public interface IResumeDocumentRepository
{
    Task<Resume?> FindForDocumentUploadAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken);
    Task AddAsync(ResumeDocument document, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
