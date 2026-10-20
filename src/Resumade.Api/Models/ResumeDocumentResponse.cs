using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record ResumeDocumentResponse(
    Guid Id,
    Guid ResumeId,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    DateTimeOffset UploadedAt)
{
    public static ResumeDocumentResponse From(ResumeDocumentResult result) => new(
        result.Id,
        result.ResumeId,
        result.OriginalFileName,
        result.ContentType,
        result.FileSize,
        result.UploadedAt);
}
