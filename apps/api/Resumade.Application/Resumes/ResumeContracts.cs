using Resumade.Domain.Resumes;

namespace Resumade.Application.Resumes;

public sealed record CreateResumeCommand(string Name);

public sealed record ResumeSummaryResult(
    Guid Id,
    string Name,
    int CurrentVersionNumber,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ResumeDetailResult(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ResumeVersionResult CurrentVersion);

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

public sealed record ExperienceResult(Guid Id, string Company, string Position, string? Location,
    YearMonth? StartDate, YearMonth? EndDate, bool IsCurrent, string? Description, int SortOrder);
public sealed record EducationResult(Guid Id, string Institution, string? Degree, string? FieldOfStudy,
    string? Location, YearMonth? StartDate, YearMonth? EndDate, string? Description, int SortOrder);
public sealed record ProjectResult(Guid Id, string Name, string? Description, string? Url,
    YearMonth? StartDate, YearMonth? EndDate, int SortOrder);
public sealed record SkillResult(Guid Id, string Name, string? Category, string? Proficiency,
    decimal? YearsExperience, int SortOrder);

public interface IResumeRepository
{
    Task AddAsync(Resume resume, CancellationToken cancellationToken);
    Task<IReadOnlyList<Resume>> ListByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<Resume?> FindByIdForUserAsync(Guid resumeId, Guid userId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
