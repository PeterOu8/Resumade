using Resumade.Domain.Profiles;

namespace Resumade.Application.Profiles;

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

public sealed record ProfileResult(
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
    public static ProfileResult From(UserProfile profile) => new(
        profile.Id,
        profile.FirstName,
        profile.LastName,
        profile.Headline,
        profile.Location,
        profile.Phone,
        profile.LinkedInUrl,
        profile.GitHubUrl,
        profile.PortfolioUrl,
        profile.Summary,
        profile.CreatedAt,
        profile.UpdatedAt);
}

public interface IProfileRepository
{
    Task<UserProfile?> FindByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task AddAsync(UserProfile profile, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
