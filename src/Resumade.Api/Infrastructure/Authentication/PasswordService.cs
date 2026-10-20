using Microsoft.AspNetCore.Identity;
using Resumade.Api.Services.Interfaces;
using Resumade.Api.Models.Entities.Identity;

namespace Resumade.Api.Infrastructure.Authentication;

public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<User> _hasher = new();

    public string Hash(User user, string password) => _hasher.HashPassword(user, password);

    public bool Verify(User user, string passwordHash, string password) =>
        _hasher.VerifyHashedPassword(user, passwordHash, password) is not PasswordVerificationResult.Failed;
}
