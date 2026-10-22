using Resumade.Api.Models.Files;
namespace Resumade.Api.Services.Interfaces;

public interface IFileStorage
{
    Task StoreAsync(FileToStore file, CancellationToken cancellationToken);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}
