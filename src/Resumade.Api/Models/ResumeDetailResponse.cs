using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record ResumeDetailResponse(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ResumeVersionResponse CurrentVersion)
{
    public static ResumeDetailResponse From(ResumeDetailResult result) => new(
        result.Id, result.Name, result.CreatedAt, result.UpdatedAt, ResumeVersionResponse.From(result.CurrentVersion));
}
