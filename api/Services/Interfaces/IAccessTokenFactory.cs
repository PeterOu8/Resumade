using Resumade.Api.Models.Identity;
using Resumade.Api.Models.Entities.Identity;

namespace Resumade.Api.Services.Interfaces;

public interface IAccessTokenFactory
{
    AuthenticationResult Create(User user);
}
