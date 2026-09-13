namespace Resumade.Application.Common;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid UserId { get; }
    string? Email { get; }
}
