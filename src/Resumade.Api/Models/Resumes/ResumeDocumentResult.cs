namespace Resumade.Api.Models.Resumes;

public sealed record ResumeDocumentResult(
    Guid Id,
    Guid ResumeId,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    DateTimeOffset UploadedAt);
