namespace Resumade.Api.Models.Entities.Resumes;

public sealed class Experience
{
    private Experience() { }

    public Experience(Guid id, Guid resumeVersionId, string company, string position, string? location,
        YearMonth? startDate, YearMonth? endDate, bool isCurrent, string? description, int sortOrder)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(company);
        ArgumentException.ThrowIfNullOrWhiteSpace(position);
        ValidateOrderAndDates(sortOrder, startDate, endDate);
        if (isCurrent && endDate is not null)
            throw new ArgumentException("A current position cannot have an end date.", nameof(endDate));

        Id = id;
        ResumeVersionId = resumeVersionId;
        Company = company.Trim();
        Position = position.Trim();
        Location = NormalizeOptional(location);
        StartDate = startDate;
        EndDate = endDate;
        IsCurrent = isCurrent;
        Description = NormalizeOptional(description);
        SortOrder = sortOrder;
    }

    public Guid Id { get; private set; }
    public Guid ResumeVersionId { get; private set; }
    public string Company { get; private set; } = null!;
    public string Position { get; private set; } = null!;
    public string? Location { get; private set; }
    public YearMonth? StartDate { get; private set; }
    public YearMonth? EndDate { get; private set; }
    public bool IsCurrent { get; private set; }
    public string? Description { get; private set; }
    public int SortOrder { get; private set; }

    internal static void ValidateOrderAndDates(int sortOrder, YearMonth? startDate, YearMonth? endDate)
    {
        if (sortOrder < 0)
            throw new ArgumentOutOfRangeException(nameof(sortOrder));
        if (startDate is not null && endDate is not null && endDate.Value.CompareTo(startDate.Value) < 0)
            throw new ArgumentException("End date cannot precede start date.", nameof(endDate));
    }

    internal static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
