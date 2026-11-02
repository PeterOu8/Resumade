using System.Text.RegularExpressions;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class ProjectExtractor
{
    internal static List<ResumeProjectDto> Extract(Section section)
    {
        var projects = new List<ResumeProjectDto>();
        foreach (var entry in ExtractionText.Entries(section.Lines, dated: false))
        {
            var project = new ResumeProjectDto();
            var descriptions = new List<Line>();
            foreach (var line in entry)
            {
                var text = ExtractionText.Text(line);
                foreach (var link in ExtractionText.Links(text))
                {
                    if (ExtractionText.HasHost(link, "github.com"))
                        project.GitHub ??= ExtractionText.NormalizeUrl(link);
                    else project.Url ??= ExtractionText.NormalizeUrl(link);
                }

                text = ExtractionText.RemoveLinks(text);
                var technology = Regex.Match(ExtractionText.WithoutBullet(text),
                    @"^(?:tech(?:nology)? stack|technologies|tech|built with|tools)\s*:\s*(.*)$",
                    RegexOptions.IgnoreCase);
                if (technology.Success)
                {
                    project.TechStack.AddRange(ExtractionText.SkillItems(technology.Groups[1].Value));
                    continue;
                }
                if (text.Length == 0 || Regex.IsMatch(text, @"^(?:github|repository|demo|website|url|live)\s*:?\s*$", RegexOptions.IgnoreCase))
                    continue;
                if (project.Name.Length == 0)
                {
                    // An explicit separator can carry a one-line project description.
                    var parts = Regex.Split(text, @"\s+[–—-]\s+|\s*\|\s*");
                    project.Name = ExtractionText.WithoutBullet(parts[0]);
                    if (parts.Length > 1)
                        descriptions.Add(new Line([line.Items[0] with { Text = string.Join(" ", parts.Skip(1)) }]));
                }
                else
                    descriptions.Add(new Line([line.Items[0] with { Text = text }]));
            }
            project.Description = string.Join("\n", ExtractionText.Bullets(descriptions));
            project.TechStack = project.TechStack.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (project.Name.Length > 0) projects.Add(project);
        }
        return projects;
    }
}
