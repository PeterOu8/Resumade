using Resumade.Api.Models.Resumes;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models;

public sealed record ResumeVersionResponse(
    Guid Id,
    int VersionNumber,
    string? Title,
    string? ProfessionalSummary,
    string SourceType,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ExperienceResponse> Experiences,
    IReadOnlyList<EducationResponse> Education,
    IReadOnlyList<ProjectResponse> Projects,
    IReadOnlyList<SkillResponse> Skills)
{
    public static ResumeVersionResponse From(ResumeVersionResult result) => new(
        result.Id,
        result.VersionNumber,
        result.Title,
        result.ProfessionalSummary,
        result.SourceType.ToString(),
        result.CreatedAt,
        result.Experiences.Select(ExperienceResponse.From).ToArray(),
        result.Education.Select(EducationResponse.From).ToArray(),
        result.Projects.Select(ProjectResponse.From).ToArray(),
        result.Skills.Select(SkillResponse.From).ToArray());
}
