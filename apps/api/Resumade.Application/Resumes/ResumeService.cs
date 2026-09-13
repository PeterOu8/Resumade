using Resumade.Application.Common;
using Resumade.Domain.Resumes;

namespace Resumade.Application.Resumes;

public sealed class ResumeService(ICurrentUser currentUser, IResumeRepository resumes)
{
    public async Task<ResumeDetailResult> CreateAsync(CreateResumeCommand command, CancellationToken cancellationToken)
    {
        var resume = new Resume(Guid.NewGuid(), currentUser.UserId, command.Name, Guid.NewGuid());
        await resumes.AddAsync(resume, cancellationToken);
        await resumes.SaveChangesAsync(cancellationToken);
        return MapDetail(resume);
    }

    public async Task<IReadOnlyList<ResumeSummaryResult>> ListAsync(CancellationToken cancellationToken)
    {
        var ownedResumes = await resumes.ListByUserIdAsync(currentUser.UserId, cancellationToken);
        return ownedResumes.Select(MapSummary).ToArray();
    }

    public async Task<ResumeDetailResult?> GetAsync(Guid resumeId, CancellationToken cancellationToken)
    {
        // Including the owner in the query prevents resource-existence disclosure across accounts.
        var resume = await resumes.FindByIdForUserAsync(resumeId, currentUser.UserId, cancellationToken);
        return resume is null ? null : MapDetail(resume);
    }

    private static ResumeSummaryResult MapSummary(Resume resume) => new(
        resume.Id,
        resume.Name,
        CurrentVersion(resume).VersionNumber,
        resume.CreatedAt,
        resume.UpdatedAt);

    private static ResumeDetailResult MapDetail(Resume resume) => new(
        resume.Id,
        resume.Name,
        resume.CreatedAt,
        resume.UpdatedAt,
        MapVersion(CurrentVersion(resume)));

    private static ResumeVersion CurrentVersion(Resume resume) =>
        resume.Versions.MaxBy(x => x.VersionNumber)
        ?? throw new InvalidOperationException("A resume must have at least one version.");

    private static ResumeVersionResult MapVersion(ResumeVersion version) => new(
        version.Id,
        version.VersionNumber,
        version.Title,
        version.ProfessionalSummary,
        version.SourceType,
        version.CreatedAt,
        version.Experiences.OrderBy(x => x.SortOrder).Select(x => new ExperienceResult(
            x.Id, x.Company, x.Position, x.Location, x.StartDate, x.EndDate, x.IsCurrent, x.Description, x.SortOrder)).ToArray(),
        version.Education.OrderBy(x => x.SortOrder).Select(x => new EducationResult(
            x.Id, x.Institution, x.Degree, x.FieldOfStudy, x.Location, x.StartDate, x.EndDate, x.Description, x.SortOrder)).ToArray(),
        version.Projects.OrderBy(x => x.SortOrder).Select(x => new ProjectResult(
            x.Id, x.Name, x.Description, x.Url, x.StartDate, x.EndDate, x.SortOrder)).ToArray(),
        version.Skills.OrderBy(x => x.SortOrder).Select(x => new SkillResult(
            x.Id, x.Name, x.Category, x.Proficiency, x.YearsExperience, x.SortOrder)).ToArray());
}
