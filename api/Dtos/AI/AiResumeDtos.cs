using System.ComponentModel.DataAnnotations;
using Resumade.Api.Dtos.Resumes;

namespace Resumade.Api.Dtos.AI;

public sealed class AiConnectionDto
{
    [Required]
    [RegularExpression("^(openai|claude|grok|gemini|deepseek)$")]
    public string Provider { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(512)]
    public string ApiKey { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? Model { get; set; }
}

public sealed class AiParseResumeDto
{
    [Required]
    public AiConnectionDto Ai { get; set; } = new();

    [Required]
    [MinLength(20)]
    [MaxLength(100000)]
    public string Text { get; set; } = string.Empty;
}

public sealed class AiTailorResumeDto
{
    [Required]
    public AiConnectionDto Ai { get; set; } = new();

    [Required]
    public ResumeContentDto Resume { get; set; } = new();

    [Required]
    [MinLength(20)]
    [MaxLength(20000)]
    public string JobDescription { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Instructions { get; set; }
}

public sealed class AiResumeResponseDto
{
    public ResumeContentDto Content { get; set; } = new();
}
