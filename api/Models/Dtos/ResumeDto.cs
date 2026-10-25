namespace Resumade.Api.Models.Dtos
{
    public class ResumeDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ContentJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
