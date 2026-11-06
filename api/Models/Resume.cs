namespace Resumade.Api.Models
{
    public class Resume
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }

        public User User { get; set; } = null!;

        public string Title { get; set; } = string.Empty;

        public string ContentJson { get; set; } = "{}";

        public string? PresentationJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
