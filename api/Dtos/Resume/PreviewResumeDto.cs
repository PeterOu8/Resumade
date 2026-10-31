namespace Resumade.Api.Dtos.Resume
{
    public class ResumePreviewDto
    {
        public Guid ResumeId { get; set; }

        public ResumeContentDto Content { get; set; } = null!;
    }
}

