using Microsoft.EntityFrameworkCore;
using Resumade.Application.Profiles;
using Resumade.Domain.Profiles;

namespace Resumade.Infrastructure.Persistence;

public sealed class ProfileRepository(ResumadeDbContext dbContext) : IProfileRepository
{
    public Task<UserProfile?> FindByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.Profiles.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

    public Task AddAsync(UserProfile profile, CancellationToken cancellationToken) =>
        dbContext.Profiles.AddAsync(profile, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
