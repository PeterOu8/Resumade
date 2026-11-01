namespace Resumade.Api.Dtos.Resumes
{
    public class ResumePreviewDto
    {
        public Guid ResumeId { get; set; }

        public ResumeContentDto Content { get; set; } = null!;
    }
}

