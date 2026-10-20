using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record EducationResponse(Guid Id, string Institution, string? Degree, string? FieldOfStudy,
    string? Location, YearMonthResponse? StartDate, YearMonthResponse? EndDate, string? Description, int SortOrder)
{
    public static EducationResponse From(EducationResult result) => new(
        result.Id, result.Institution, result.Degree, result.FieldOfStudy, result.Location,
        YearMonthResponse.From(result.StartDate), YearMonthResponse.From(result.EndDate), result.Description, result.SortOrder);
}
