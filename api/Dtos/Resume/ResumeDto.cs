namespace Resumade.Api.Dtos.Resume;

public class ResumeDto
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public ResumeContentDto Content { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}