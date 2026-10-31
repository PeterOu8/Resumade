using Resumade.Api.Dtos.Resume;
using System.Text.RegularExpressions;

namespace Resumade.Api.Services.ResumerParser
{
    public partial class ResumeParserService
    {
        private List<ResumeExperienceDto> ExtractExperience(Dictionary<string, List<string>> sections)
        {
            var experiences = new List<ResumeExperienceDto>();
            if (!sections.TryGetValue("experience", out var expLines))
                return experiences;

            // Simple subsection split: look for date patterns or bold-ish (ALL CAPS / short title lines)
            var current = new ResumeExperienceDto();
            var bullets = new List<string>();

            foreach (var line in expLines)
            {
                // Detect new job entry (contains year or "Present")
                if (Regex.IsMatch(line, @"(19|20)\d{2}") || line.Contains("Present", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrEmpty(current.Company) || !string.IsNullOrEmpty(current.Title))
                    {
                        current.Bullets = bullets;
                        experiences.Add(current);
                        current = new ResumeExperienceDto();
                        bullets = new List<string>();
                    }

                    // Very naive split – improve with more feature scoring later
                    var parts = line.Split(new[] { '|', '–', '-', '—' }, StringSplitOptions.TrimEntries);
                    if (parts.Length >= 2)
                    {
                        current.Title = parts[0];
                        current.Company = parts.Length > 1 ? parts[1] : "";
                        // Date handling left simple
                        current.StartDate = ExtractDate(line, isStart: true);
                        current.EndDate = ExtractDate(line, isStart: false);
                        current.Current = line.Contains("Present", StringComparison.OrdinalIgnoreCase);
                    }
                    else
                    {
                        current.Title = line;
                    }
                }
                else if (line.StartsWith("•") || line.StartsWith("-") || line.StartsWith("*") || line.StartsWith("–"))
                {
                    bullets.Add(line.TrimStart('•', '-', '*', '–', ' ').Trim());
                }
                else if (string.IsNullOrEmpty(current.Company) && !string.IsNullOrEmpty(current.Title))
                {
                    current.Company = line; // company often on next line
                }
                else if (string.IsNullOrEmpty(current.Location) && Regex.IsMatch(line, @"[A-Z][a-z]+,\s*[A-Z]{2}"))
                {
                    current.Location = line;
                }
            }

            if (!string.IsNullOrEmpty(current.Company) || !string.IsNullOrEmpty(current.Title))
            {
                current.Bullets = bullets;
                experiences.Add(current);
            }

            return experiences;
        }
    }
}
