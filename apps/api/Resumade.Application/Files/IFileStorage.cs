namespace Resumade.Application.Files;

public sealed record FileToStore(Stream Content, string StorageKey);

public interface IFileStorage
{
    Task StoreAsync(FileToStore file, CancellationToken cancellationToken);
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}
