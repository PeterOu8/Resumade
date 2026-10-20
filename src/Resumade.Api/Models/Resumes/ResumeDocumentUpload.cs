namespace Resumade.Api.Models.Resumes;

public sealed record ResumeDocumentUpload(
    Stream Content,
    string OriginalFileName,
    string ContentType,
    long FileSize);
