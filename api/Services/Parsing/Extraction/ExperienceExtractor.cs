using System.Text.RegularExpressions;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class ExperienceExtractor
{
    internal static List<ResumeExperienceDto> Extract(Section section)
    {
        var experiences = new List<ResumeExperienceDto>();
        foreach (var entry in ExtractionText.Entries(section.Lines))
        {
            var bodyStart = ExtractionText.BodyStart(entry);
            var headers = entry.Take(bodyStart).ToList();
            var parts = headers.SelectMany(line => ExtractionText.Parts(line))
                .SelectMany(part => Regex.Split(part, @"\s+at\s+", RegexOptions.IgnoreCase))
                .Where(part => part.Length > 0).ToList();
            var date = headers.Select(line => DateExtractor.Extract(ExtractionText.Text(line)))
                .FirstOrDefault(value => value is not null);
            var title = parts.FirstOrDefault(ExtractionText.IsJobTitle) ?? string.Empty;
            parts.Remove(title);
            var location = parts.FirstOrDefault(part => part.Contains(',') ||
                part.Equals("Remote", StringComparison.OrdinalIgnoreCase) ||
                part.StartsWith("Location:", StringComparison.OrdinalIgnoreCase)) ?? string.Empty;
            parts.Remove(location);
            var company = parts.FirstOrDefault() ?? string.Empty;
            parts.Remove(company);
            // With plain headers the common order is company, title, location.
            if (title.Length == 0 && parts.Count > 0)
            {
                title = parts[0];
                parts.RemoveAt(0);
            }
            if (location.Length == 0 && parts.Count > 0) location = parts[0];

            if (company.Length == 0 && title.Length == 0) continue;
            experiences.Add(new ResumeExperienceDto
            {
                Company = company,
                Title = title,
                Location = Regex.Replace(location, @"^location\s*:\s*", "", RegexOptions.IgnoreCase),
                StartDate = date?.StartDate ?? string.Empty,
                EndDate = date?.EndDate,
                Current = date?.Current ?? false,
                Bullets = ExtractionText.Bullets(entry.Skip(bodyStart))
            });
        }
        return experiences;
    }
}
