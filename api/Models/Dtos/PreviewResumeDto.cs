namespace Resumade.Api.Models.Dtos
{
    public class ResumePreviewDto
    {
        public Guid ResumeId { get; set; }

        public string ContentJson { get; set; } = "{}";
    }
}
