using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Dtos.Auth;

public record AccountEmailDto([Required, EmailAddress, MaxLength(254)] string Email);
public record VerifyEmailDto([Required, StringLength(64, MinimumLength = 64)] string Token);
public record ResetPasswordDto(
    [Required, StringLength(64, MinimumLength = 64)] string Token,
    [Required, StringLength(128, MinimumLength = 8)] string Password);
