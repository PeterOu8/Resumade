using Resumade.Api.Models.Profiles;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Profiles;

namespace Resumade.Api.Services;

public sealed class ProfileService(ICurrentUser currentUser, IProfileRepository profiles)
{
    public async Task<ProfileResult?> GetAsync(CancellationToken cancellationToken)
    {
        var profile = await profiles.FindByUserIdAsync(currentUser.UserId, cancellationToken);
        return profile is null ? null : ProfileResult.From(profile);
    }

    public async Task<ProfileResult> UpsertAsync(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        // Ownership comes exclusively from the validated identity, never request data.
        var userId = currentUser.UserId;
        var profile = await profiles.FindByUserIdAsync(userId, cancellationToken);

        if (profile is null)
        {
            profile = new UserProfile(Guid.NewGuid(), userId, command.FirstName, command.LastName);
            await profiles.AddAsync(profile, cancellationToken);
        }

        profile.Update(
            command.FirstName,
            command.LastName,
            command.Headline,
            command.Location,
            command.Phone,
            command.LinkedInUrl,
            command.GitHubUrl,
            command.PortfolioUrl,
            command.Summary);

        await profiles.SaveChangesAsync(cancellationToken);
        return ProfileResult.From(profile);
    }
}
