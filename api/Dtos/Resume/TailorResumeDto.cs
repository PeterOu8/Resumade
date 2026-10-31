using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Dtos.Resume;

public class TailorResumeDto
{
    [Required]
    [MinLength(20)]
    [MaxLength(20000)]
    public string JobDescription { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Instructions { get; set; }
}