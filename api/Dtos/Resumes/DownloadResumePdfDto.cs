using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Dtos.Resumes;

public sealed class DownloadResumePdfDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(1_000_000)]
    public string Html { get; set; } = string.Empty;
}
