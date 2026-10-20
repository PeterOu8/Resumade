using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models.Resumes;

public sealed record EducationResult(Guid Id, string Institution, string? Degree, string? FieldOfStudy,
    string? Location, YearMonth? StartDate, YearMonth? EndDate, string? Description, int SortOrder);
