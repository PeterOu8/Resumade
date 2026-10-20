using Microsoft.EntityFrameworkCore;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence;

public sealed class ResumeDocumentRepository(ResumadeDbContext dbContext) : IResumeDocumentRepository
{
    public Task<Resume?> FindForDocumentUploadAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken) =>
        dbContext.Resumes
            .Where(x => x.Id == resumeId && x.UserId == userId)
            .Include(x => x.Document)
            .SingleOrDefaultAsync(cancellationToken);

    public Task AddAsync(ResumeDocument document, CancellationToken cancellationToken) =>
        dbContext.ResumeDocuments.AddAsync(document, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);
}
