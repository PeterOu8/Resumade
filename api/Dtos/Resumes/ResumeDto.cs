namespace Resumade.Api.Dtos.Resumes;

using System.Text.Json;

public class ResumeDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public ResumeContentDto Content { get; set; } = new();

    public JsonElement? Presentation { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
