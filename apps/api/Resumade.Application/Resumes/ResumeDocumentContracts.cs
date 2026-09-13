namespace Resumade.Application.Resumes;

public sealed record ResumeDocumentUpload(
    Stream Content,
    string OriginalFileName,
    string ContentType,
    long FileSize);

public sealed record ResumeDocumentResult(
    Guid Id,
    Guid ResumeId,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    DateTimeOffset UploadedAt);
