namespace Resumade.Api.Models.Resumes;

public sealed record ResumeSummaryResult(
    Guid Id,
    string Name,
    int CurrentVersionNumber,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
