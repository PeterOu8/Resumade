using Resumade.Application.Common;
using Resumade.Application.Files;
using Resumade.Domain.Resumes;

namespace Resumade.Application.Resumes;

public sealed class ResumeDocumentService(
    ICurrentUser currentUser,
    IResumeDocumentRepository resumes,
    IFileStorage storage)
{
    public const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> SupportedTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

    public async Task<ResumeDocumentResult> UploadAsync(
        Guid resumeId,
        ResumeDocumentUpload upload,
        CancellationToken cancellationToken)
    {
        Validate(upload);
        var resume = await resumes.FindForDocumentUploadAsync(resumeId, currentUser.UserId, cancellationToken)
            ?? throw new ResumeNotFoundException();

        var extension = Path.GetExtension(upload.OriginalFileName).ToLowerInvariant();
        var storageKey = $"resumes/{resumeId:N}/{Guid.NewGuid():N}{extension}";
        var oldDocument = resume.Document;
        var oldStorageKey = oldDocument?.StorageKey;

        await storage.StoreAsync(new FileToStore(upload.Content, storageKey), cancellationToken);
        ResumeDocument document;
        if (oldDocument is null)
        {
            document = new ResumeDocument(
                Guid.NewGuid(),
                resumeId,
                Path.GetFileName(upload.OriginalFileName),
                storageKey,
                SupportedTypes[extension],
                upload.FileSize);
            resume.ReplaceDocument(document);
            await resumes.AddAsync(document, cancellationToken);
        }
        else
        {
            document = oldDocument;
            oldDocument.ReplaceMetadata(
                Path.GetFileName(upload.OriginalFileName),
                storageKey,
                SupportedTypes[extension],
                upload.FileSize);
        }

        try
        {
            await resumes.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await TryDeleteAsync(storageKey, cancellationToken);
            throw;
        }

        if (oldStorageKey is not null && oldStorageKey != storageKey)
            await TryDeleteAsync(oldStorageKey, cancellationToken);

        return new ResumeDocumentResult(
            document.Id,
            document.ResumeId,
            document.OriginalFileName,
            document.ContentType,
            document.FileSize,
            document.UploadedAt);
    }

    private static void Validate(ResumeDocumentUpload upload)
    {
        if (upload.Content is null || upload.FileSize <= 0)
            throw new InvalidResumeDocumentException("A non-empty document is required.");
        if (upload.FileSize > MaxFileSizeBytes)
            throw new InvalidResumeDocumentException("The document exceeds the 10 MB limit.");

        var extension = Path.GetExtension(upload.OriginalFileName);
        if (!SupportedTypes.TryGetValue(extension, out var expectedContentType) ||
            !string.Equals(expectedContentType, upload.ContentType, StringComparison.OrdinalIgnoreCase))
            throw new InvalidResumeDocumentException("Only PDF and DOCX documents with their expected content types are supported.");
    }

    private async Task TryDeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        try
        {
            await storage.DeleteAsync(storageKey, cancellationToken);
        }
        catch
        {
            // Metadata remains authoritative; a later storage cleanup job can remove an orphaned file.
        }
    }
}

public sealed class ResumeNotFoundException : Exception;
public sealed class InvalidResumeDocumentException(string message) : Exception(message);
