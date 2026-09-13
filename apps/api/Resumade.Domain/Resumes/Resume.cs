namespace Resumade.Domain.Resumes;

public sealed class Resume
{
    private readonly List<ResumeVersion> _versions = [];
    private Resume() { }

    public Resume(Guid id, Guid userId, string name, Guid initialVersionId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        Id = id;
        UserId = userId;
        Name = name.Trim();
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
        _versions.Add(new ResumeVersion(initialVersionId, id, 1, null, null, ResumeSourceType.Manual));
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Name { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }
    public ResumeDocument? Document { get; private set; }
    public IReadOnlyCollection<ResumeVersion> Versions => _versions;

    public void ReplaceDocument(ResumeDocument document)
    {
        if (document.ResumeId != Id)
            throw new ArgumentException("The document belongs to a different resume.", nameof(document));

        Document = document;
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AddVersion(ResumeVersion version)
    {
        if (version.ResumeId != Id)
            throw new ArgumentException("The version belongs to a different resume.", nameof(version));
        if (_versions.Any(x => x.VersionNumber == version.VersionNumber))
            throw new InvalidOperationException("Version numbers must be unique within a resume.");

        _versions.Add(version);
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
