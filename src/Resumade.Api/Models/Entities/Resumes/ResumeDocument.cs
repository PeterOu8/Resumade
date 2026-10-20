namespace Resumade.Api.Models.Entities.Resumes;

public sealed class ResumeDocument
{
    private ResumeDocument() { }

    public ResumeDocument(Guid id, Guid resumeId, string originalFileName, string storageKey,
        string contentType, long fileSize)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalFileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        if (fileSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(fileSize));

        Id = id;
        ResumeId = resumeId;
        OriginalFileName = originalFileName.Trim();
        StorageKey = storageKey.Trim();
        ContentType = contentType.Trim();
        FileSize = fileSize;
        UploadedAt = DateTimeOffset.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid ResumeId { get; private set; }
    public string OriginalFileName { get; private set; } = null!;
    public string StorageKey { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long FileSize { get; private set; }
    public DateTimeOffset UploadedAt { get; private set; }

    public void ReplaceMetadata(string originalFileName, string storageKey, string contentType, long fileSize)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originalFileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(storageKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        if (fileSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(fileSize));

        OriginalFileName = originalFileName.Trim();
        StorageKey = storageKey.Trim();
        ContentType = contentType.Trim();
        FileSize = fileSize;
        UploadedAt = DateTimeOffset.UtcNow;
    }
}
