using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record ProjectResponse(Guid Id, string Name, string? Description, string? Url,
    YearMonthResponse? StartDate, YearMonthResponse? EndDate, int SortOrder)
{
    public static ProjectResponse From(ProjectResult result) => new(
        result.Id, result.Name, result.Description, result.Url, YearMonthResponse.From(result.StartDate),
        YearMonthResponse.From(result.EndDate), result.SortOrder);
}
