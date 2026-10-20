using Microsoft.EntityFrameworkCore;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Profiles;

namespace Resumade.Api.Infrastructure.Persistence;

public sealed class ProfileRepository(ResumadeDbContext dbContext) : IProfileRepository
{
    public Task<UserProfile?> FindByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.Profiles.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

    public Task AddAsync(UserProfile profile, CancellationToken cancellationToken) =>
        dbContext.Profiles.AddAsync(profile, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
