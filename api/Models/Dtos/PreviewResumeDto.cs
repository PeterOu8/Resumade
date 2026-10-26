namespace Resumade.Api.Models.Dtos
{
    public class ResumePreviewDto
    {
        public Guid ResumeId { get; set; }

        public ResumeContentDto Content { get; set; } = null!;
    }
}
