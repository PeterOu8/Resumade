using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Models;

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
