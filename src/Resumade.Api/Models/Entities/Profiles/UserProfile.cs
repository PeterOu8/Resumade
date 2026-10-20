namespace Resumade.Api.Models.Entities.Profiles;

public sealed class UserProfile
{
    private UserProfile() { }

    public UserProfile(Guid id, Guid userId, string firstName, string lastName)
    {
        Id = id;
        UserId = userId;
        CreatedAt = DateTimeOffset.UtcNow;
        Update(firstName, lastName, null, null, null, null, null, null, null);
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string FirstName { get; private set; } = null!;
    public string LastName { get; private set; } = null!;
    public string? Headline { get; private set; }
    public string? Location { get; private set; }
    public string? Phone { get; private set; }
    public string? LinkedInUrl { get; private set; }
    public string? GitHubUrl { get; private set; }
    public string? PortfolioUrl { get; private set; }
    public string? Summary { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public void Update(
        string firstName,
        string lastName,
        string? headline,
        string? location,
        string? phone,
        string? linkedInUrl,
        string? gitHubUrl,
        string? portfolioUrl,
        string? summary)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(firstName);
        ArgumentException.ThrowIfNullOrWhiteSpace(lastName);
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Headline = NormalizeOptional(headline);
        Location = NormalizeOptional(location);
        Phone = NormalizeOptional(phone);
        LinkedInUrl = NormalizeOptional(linkedInUrl);
        GitHubUrl = NormalizeOptional(gitHubUrl);
        PortfolioUrl = NormalizeOptional(portfolioUrl);
        Summary = NormalizeOptional(summary);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
