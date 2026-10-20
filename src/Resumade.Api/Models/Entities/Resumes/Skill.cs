namespace Resumade.Api.Models.Entities.Resumes;

public sealed class Skill
{
    private Skill() { }

    public Skill(Guid id, Guid resumeVersionId, string name, string? category, string? proficiency,
        decimal? yearsExperience, int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (yearsExperience < 0)
            throw new ArgumentOutOfRangeException(nameof(yearsExperience));
        if (sortOrder < 0)
            throw new ArgumentOutOfRangeException(nameof(sortOrder));

        Id = id;
        ResumeVersionId = resumeVersionId;
        Name = name.Trim();
        Category = Experience.NormalizeOptional(category);
        Proficiency = Experience.NormalizeOptional(proficiency);
        YearsExperience = yearsExperience;
        SortOrder = sortOrder;
    }

    public Guid Id { get; private set; }
    public Guid ResumeVersionId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Category { get; private set; }
    public string? Proficiency { get; private set; }
    public decimal? YearsExperience { get; private set; }
    public int SortOrder { get; private set; }
}
