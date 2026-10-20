using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models.Resumes;

public sealed record ExperienceResult(Guid Id, string Company, string Position, string? Location,
    YearMonth? StartDate, YearMonth? EndDate, bool IsCurrent, string? Description, int SortOrder);
