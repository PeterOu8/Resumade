using Resumade.Api.Models.Entities.Profiles;

namespace Resumade.Api.Services.Interfaces;

public interface IProfileRepository
{
    Task<UserProfile?> FindByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task AddAsync(UserProfile profile, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
