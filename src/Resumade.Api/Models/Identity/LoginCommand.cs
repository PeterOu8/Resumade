namespace Resumade.Api.Models.Identity;

public sealed record LoginCommand(string Email, string Password);
