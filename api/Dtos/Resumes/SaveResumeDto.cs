using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Resumade.Api.Infrastructure.Validation;

namespace Resumade.Api.Dtos.Resumes;

public sealed class SaveResumeDto
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot be longer than 200 characters")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Content is required")]
    [ResumeContentAttribute]
    public ResumeContentDto Content { get; set; } = null!;

    public JsonElement? Presentation { get; set; }
}
