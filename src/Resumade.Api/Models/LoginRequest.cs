using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Models;

public sealed record LoginRequest(
    [Required, EmailAddress, StringLength(320)] string Email,
    [Required, StringLength(128)] string Password);
