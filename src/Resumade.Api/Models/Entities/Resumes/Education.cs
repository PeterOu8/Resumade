namespace Resumade.Api.Models.Entities.Resumes;

public sealed class Education
{
    private Education() { }

    public Education(Guid id, Guid resumeVersionId, string institution, string? degree, string? fieldOfStudy,
        string? location, YearMonth? startDate, YearMonth? endDate, string? description, int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(institution);
        Experience.ValidateOrderAndDates(sortOrder, startDate, endDate);
        Id = id;
        ResumeVersionId = resumeVersionId;
        Institution = institution.Trim();
        Degree = Experience.NormalizeOptional(degree);
        FieldOfStudy = Experience.NormalizeOptional(fieldOfStudy);
        Location = Experience.NormalizeOptional(location);
        StartDate = startDate;
        EndDate = endDate;
        Description = Experience.NormalizeOptional(description);
        SortOrder = sortOrder;
    }

    public Guid Id { get; private set; }
    public Guid ResumeVersionId { get; private set; }
    public string Institution { get; private set; } = null!;
    public string? Degree { get; private set; }
    public string? FieldOfStudy { get; private set; }
    public string? Location { get; private set; }
    public YearMonth? StartDate { get; private set; }
    public YearMonth? EndDate { get; private set; }
    public string? Description { get; private set; }
    public int SortOrder { get; private set; }
}
