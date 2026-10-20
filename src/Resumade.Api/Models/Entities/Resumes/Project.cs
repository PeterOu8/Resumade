namespace Resumade.Api.Models.Entities.Resumes;

public sealed class Project
{
    private Project() { }

    public Project(Guid id, Guid resumeVersionId, string name, string? description, string? url,
        YearMonth? startDate, YearMonth? endDate, int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        Experience.ValidateOrderAndDates(sortOrder, startDate, endDate);
        Id = id;
        ResumeVersionId = resumeVersionId;
        Name = name.Trim();
        Description = Experience.NormalizeOptional(description);
        Url = Experience.NormalizeOptional(url);
        StartDate = startDate;
        EndDate = endDate;
        SortOrder = sortOrder;
    }

    public Guid Id { get; private set; }
    public Guid ResumeVersionId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string? Url { get; private set; }
    public YearMonth? StartDate { get; private set; }
    public YearMonth? EndDate { get; private set; }
    public int SortOrder { get; private set; }
}
