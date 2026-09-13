using Microsoft.EntityFrameworkCore;
using Npgsql;
using Resumade.Application.Identity;
using Resumade.Domain.Identity;

namespace Resumade.Infrastructure.Persistence;

public sealed class UserRepository(ResumadeDbContext dbContext) : IUserRepository
{
    public Task<bool> EmailExistsAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.AnyAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task<User?> FindByNormalizedEmailAsync(string normalizedEmail, CancellationToken cancellationToken) =>
        dbContext.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail, cancellationToken);

    public Task AddAsync(User user, CancellationToken cancellationToken) =>
        dbContext.Users.AddAsync(user, cancellationToken).AsTask();

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // The database constraint also protects against two registrations racing the pre-check.
            throw new IdentityConflictException("An account with this email already exists.");
        }
    }
}
