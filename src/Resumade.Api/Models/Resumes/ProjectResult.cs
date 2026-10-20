using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models.Resumes;

public sealed record ProjectResult(Guid Id, string Name, string? Description, string? Url,
    YearMonth? StartDate, YearMonth? EndDate, int SortOrder);
