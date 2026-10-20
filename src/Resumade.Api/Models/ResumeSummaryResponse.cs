using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record ResumeSummaryResponse(
    Guid Id,
    string Name,
    int CurrentVersionNumber,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static ResumeSummaryResponse From(ResumeSummaryResult result) => new(
        result.Id, result.Name, result.CurrentVersionNumber, result.CreatedAt, result.UpdatedAt);
}
