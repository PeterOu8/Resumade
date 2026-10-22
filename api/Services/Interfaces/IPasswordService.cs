using Resumade.Api.Models.Entities.Identity;

namespace Resumade.Api.Services.Interfaces;

public interface IPasswordService
{
    string Hash(User user, string password);
    bool Verify(User user, string passwordHash, string password);
}
