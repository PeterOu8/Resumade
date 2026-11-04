namespace Resumade.Api.Models;

public enum AccountAction
{
    VerifyEmail,
    ResetPassword
}

public sealed class AccountActionToken
{
    public string Hash { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public AccountAction Purpose { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? ConsumedAtUtc { get; set; }
}
