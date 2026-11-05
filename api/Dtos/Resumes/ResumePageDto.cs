namespace Resumade.Api.Dtos.Resumes;

public sealed record ResumeSummaryDto(Guid Id, string Title, DateTime CreatedAt, DateTime UpdatedAt);

public sealed record ResumePageDto(IReadOnlyList<ResumeSummaryDto> Items, string? NextCursor);
