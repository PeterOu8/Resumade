using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record ExperienceResponse(Guid Id, string Company, string Position, string? Location,
    YearMonthResponse? StartDate, YearMonthResponse? EndDate, bool IsCurrent, string? Description, int SortOrder)
{
    public static ExperienceResponse From(ExperienceResult result) => new(
        result.Id, result.Company, result.Position, result.Location, YearMonthResponse.From(result.StartDate),
        YearMonthResponse.From(result.EndDate), result.IsCurrent, result.Description, result.SortOrder);
}
