using Resumade.Api.Models.Files;
using Microsoft.Extensions.Options;
using Resumade.Api.Services.Interfaces;

namespace Resumade.Api.Infrastructure.FileStorage;

public sealed class LocalFileStorage(IOptions<FileStorageOptions> options)
    : IFileStorage
{
    private readonly string _rootPath = ResolveRoot(options.Value.RootPath);

    public async Task StoreAsync(FileToStore file, CancellationToken cancellationToken)
    {
        var path = ResolvePath(file.StorageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        await using var destination = new FileStream(
            path,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            bufferSize: 64 * 1024,
            options: FileOptions.Asynchronous | FileOptions.SequentialScan);
        await file.Content.CopyToAsync(destination, cancellationToken);
        await destination.FlushAsync(cancellationToken);
    }

    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = ResolvePath(storageKey);
        if (File.Exists(path))
            File.Delete(path);
        return Task.CompletedTask;
    }

    private string ResolvePath(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey) || Path.IsPathRooted(storageKey) ||
            storageKey.Contains("..", StringComparison.Ordinal))
            throw new ArgumentException("Storage keys must be relative and cannot traverse directories.", nameof(storageKey));

        var candidate = Path.GetFullPath(Path.Combine(_rootPath, storageKey.Replace('/', Path.DirectorySeparatorChar)));
        var rootWithSeparator = _rootPath.EndsWith(Path.DirectorySeparatorChar)
            ? _rootPath
            : _rootPath + Path.DirectorySeparatorChar;
        if (!candidate.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Storage key resolves outside the configured storage root.", nameof(storageKey));

        return candidate;
    }

    private static string ResolveRoot(string? configuredRoot)
    {
        var root = string.IsNullOrWhiteSpace(configuredRoot)
            ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Resumade", "uploads")
            : configuredRoot;
        var fullRoot = Path.GetFullPath(root);
        Directory.CreateDirectory(fullRoot);
        return fullRoot;
    }
}
