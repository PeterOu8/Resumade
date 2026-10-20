namespace Resumade.Api.Models.Profiles;

public sealed record UpdateProfileCommand(
    string FirstName,
    string LastName,
    string? Headline,
    string? Location,
    string? Phone,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl,
    string? Summary);
