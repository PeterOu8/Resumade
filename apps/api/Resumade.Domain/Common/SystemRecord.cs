namespace Resumade.Domain.Common;

public sealed class SystemRecord
{
    public Guid Id { get; private set; }

    public DateTimeOffset Created { get; private set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastModified { get; private set; } = DateTimeOffset.UtcNow;

    public SystemRecord(Guid id, DateTimeOffset created)
    {
        Id = id;
        Created = created;
    }
    public void UpdateLastModified()
    {
        LastModified = DateTimeOffset.UtcNow;
    }
}