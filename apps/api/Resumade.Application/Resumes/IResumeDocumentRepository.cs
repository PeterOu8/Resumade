using Resumade.Domain.Resumes;

namespace Resumade.Application.Resumes;

public interface IResumeDocumentRepository
{
    Task<Resume?> FindForDocumentUploadAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken);
    Task AddAsync(ResumeDocument document, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
