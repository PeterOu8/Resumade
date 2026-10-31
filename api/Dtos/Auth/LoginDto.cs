namespace Resumade.Api.Dtos.Auth
{
    public class LoginDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.MaxLength(254)]
        public string Email { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}
