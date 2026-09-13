using System.ComponentModel.DataAnnotations;
using Resumade.Application.Resumes;
using Resumade.Domain.Resumes;

namespace Resumade.Api.Contracts;

public sealed record CreateResumeRequest([Required, StringLength(200)] string Name);

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

public sealed record YearMonthResponse(int Year, int Month)
{
    public static YearMonthResponse? From(YearMonth? value) =>
        value is null ? null : new YearMonthResponse(value.Value.Year, value.Value.Month);
}

public sealed record ExperienceResponse(Guid Id, string Company, string Position, string? Location,
    YearMonthResponse? StartDate, YearMonthResponse? EndDate, bool IsCurrent, string? Description, int SortOrder)
{
    public static ExperienceResponse From(ExperienceResult result) => new(
        result.Id, result.Company, result.Position, result.Location, YearMonthResponse.From(result.StartDate),
        YearMonthResponse.From(result.EndDate), result.IsCurrent, result.Description, result.SortOrder);
}

public sealed record EducationResponse(Guid Id, string Institution, string? Degree, string? FieldOfStudy,
    string? Location, YearMonthResponse? StartDate, YearMonthResponse? EndDate, string? Description, int SortOrder)
{
    public static EducationResponse From(EducationResult result) => new(
        result.Id, result.Institution, result.Degree, result.FieldOfStudy, result.Location,
        YearMonthResponse.From(result.StartDate), YearMonthResponse.From(result.EndDate), result.Description, result.SortOrder);
}

public sealed record ProjectResponse(Guid Id, string Name, string? Description, string? Url,
    YearMonthResponse? StartDate, YearMonthResponse? EndDate, int SortOrder)
{
    public static ProjectResponse From(ProjectResult result) => new(
        result.Id, result.Name, result.Description, result.Url, YearMonthResponse.From(result.StartDate),
        YearMonthResponse.From(result.EndDate), result.SortOrder);
}

public sealed record SkillResponse(Guid Id, string Name, string? Category, string? Proficiency,
    decimal? YearsExperience, int SortOrder)
{
    public static SkillResponse From(SkillResult result) => new(
        result.Id, result.Name, result.Category, result.Proficiency, result.YearsExperience, result.SortOrder);
}
