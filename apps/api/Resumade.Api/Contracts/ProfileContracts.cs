using System.ComponentModel.DataAnnotations;
using Resumade.Application.Profiles;

namespace Resumade.Api.Contracts;

public sealed record UpdateProfileRequest(
    [Required, StringLength(100)] string FirstName,
    [Required, StringLength(100)] string LastName,
    [StringLength(200)] string? Headline,
    [StringLength(200)] string? Location,
    [StringLength(40)] string? Phone,
    [Url, StringLength(2048)] string? LinkedInUrl,
    [Url, StringLength(2048)] string? GitHubUrl,
    [Url, StringLength(2048)] string? PortfolioUrl,
    [StringLength(4000)] string? Summary);

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
