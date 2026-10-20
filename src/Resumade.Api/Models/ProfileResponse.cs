using Resumade.Api.Models.Profiles;

namespace Resumade.Api.Models;

public sealed record ProfileResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string? Headline,
    string? Location,
    string? Phone,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl,
    string? Summary,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static ProfileResponse From(ProfileResult result) => new(
        result.Id,
        result.FirstName,
        result.LastName,
        result.Headline,
        result.Location,
        result.Phone,
        result.LinkedInUrl,
        result.GitHubUrl,
        result.PortfolioUrl,
        result.Summary,
        result.CreatedAt,
        result.UpdatedAt);
}
