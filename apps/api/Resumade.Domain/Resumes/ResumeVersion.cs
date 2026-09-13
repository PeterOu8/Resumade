namespace Resumade.Domain.Resumes;

public sealed class ResumeVersion
{
    private readonly List<Experience> _experiences = [];
    private readonly List<Education> _education = [];
    private readonly List<Project> _projects = [];
    private readonly List<Skill> _skills = [];
    private ResumeVersion() { }

    public ResumeVersion(
        Guid id,
        Guid resumeId,
        int versionNumber,
        string? title,
        string? professionalSummary,
        ResumeSourceType sourceType)
    {
        if (versionNumber < 1)
            throw new ArgumentOutOfRangeException(nameof(versionNumber));

        Id = id;
        ResumeId = resumeId;
        VersionNumber = versionNumber;
        Title = NormalizeOptional(title);
        ProfessionalSummary = NormalizeOptional(professionalSummary);
        SourceType = sourceType;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid ResumeId { get; private set; }
    public int VersionNumber { get; private set; }
    public string? Title { get; private set; }
    public string? ProfessionalSummary { get; private set; }
    public ResumeSourceType SourceType { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public IReadOnlyCollection<Experience> Experiences => _experiences;
    public IReadOnlyCollection<Education> Education => _education;
    public IReadOnlyCollection<Project> Projects => _projects;
    public IReadOnlyCollection<Skill> Skills => _skills;

    public void AddExperience(Experience experience) => AddChild(experience.ResumeVersionId, experience, _experiences);
    public void AddEducation(Education education) => AddChild(education.ResumeVersionId, education, _education);
    public void AddProject(Project project) => AddChild(project.ResumeVersionId, project, _projects);
    public void AddSkill(Skill skill) => AddChild(skill.ResumeVersionId, skill, _skills);

    private void AddChild<T>(Guid resumeVersionId, T child, ICollection<T> collection)
    {
        if (resumeVersionId != Id)
            throw new ArgumentException("The item belongs to a different resume version.", nameof(child));
        collection.Add(child);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
