using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models.Resumes;

public sealed record ResumeVersionResult(
    Guid Id,
    int VersionNumber,
    string? Title,
    string? ProfessionalSummary,
    ResumeSourceType SourceType,
    DateTimeOffset CreatedAt,
    IReadOnlyList<ExperienceResult> Experiences,
    IReadOnlyList<EducationResult> Education,
    IReadOnlyList<ProjectResult> Projects,
    IReadOnlyList<SkillResult> Skills);
