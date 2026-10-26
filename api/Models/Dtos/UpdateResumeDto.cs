using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Models.Dtos
{
    public class UpdateResumeDto
    {
        [Required(ErrorMessage = "Title is required")]
        [MaxLength(200, ErrorMessage = "Title cannot be longer than 200 characters")]
        public string Title { get; set; } = string.Empty;

        [Required(ErrorMessage = "Content is required")]
        public ResumeContentDto Content { get; set; } = null!;
    }
}
