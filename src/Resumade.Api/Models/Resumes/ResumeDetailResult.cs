namespace Resumade.Api.Models.Resumes;

public sealed record ResumeDetailResult(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ResumeVersionResult CurrentVersion);
