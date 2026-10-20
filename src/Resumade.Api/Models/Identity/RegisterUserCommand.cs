namespace Resumade.Api.Models.Identity;

public sealed record RegisterUserCommand(string Email, string Password);
