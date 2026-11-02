using System.Text.RegularExpressions;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class EducationExtractor
{
    private static readonly Regex Degree = new(
        @"\b(bachelor|master|doctor|doctorate|ph\.?d|b\.?sc|m\.?sc|b\.?a|m\.?a|b\.?s|m\.?s|beng|meng|mba|diploma|certificate|associate)\b",
        RegexOptions.IgnoreCase);
    private static readonly Regex School = new(
        @"\b(university|college|institute|school|polytechnic|tafe)\b", RegexOptions.IgnoreCase);

    internal static List<ResumeEducationDto> Extract(Section section)
    {
        var education = new List<ResumeEducationDto>();
        foreach (var entry in ExtractionText.Entries(section.Lines))
        {
            var item = new ResumeEducationDto();
            var headers = new List<Line>();
            foreach (var line in entry)
            {
                var text = ExtractionText.WithoutBullet(ExtractionText.Text(line));
                var major = Regex.Match(text, @"^(?:major|speciali[sz]ation|field of study)\s*:\s*(.+)$", RegexOptions.IgnoreCase);
                if (major.Success)
                    item.Major = major.Groups[1].Value.Trim();
                else if (!Degree.IsMatch(text) && !School.IsMatch(text) &&
                         Regex.IsMatch(text, @"\b(award|scholarship|dean'?s list|honou?rs?|distinction|cum laude)\b", RegexOptions.IgnoreCase))
                    item.Awards.Add(text);
                else if (!ExtractionText.IsBullet(ExtractionText.Text(line)))
                    headers.Add(line);
            }
            var date = headers.Select(line => DateExtractor.Extract(ExtractionText.Text(line)))
                .FirstOrDefault(value => value is not null);
            if (date is not null)
            {
                // A lone education date commonly denotes graduation, not enrolment.
                item.StartDate = date.EndDate is null && !date.Current ? string.Empty : date.StartDate;
                item.EndDate = date.EndDate ?? (date.Current ? null : date.StartDate);
                item.Current = date.Current;
            }
            var parts = headers.SelectMany(line => ExtractionText.Parts(line))
                .Where(part => !Regex.IsMatch(part, @"^(?:graduated|graduation|expected)\s*:?\s*$", RegexOptions.IgnoreCase)).ToList();
            item.Degree = parts.FirstOrDefault(part => Degree.IsMatch(part)) ?? string.Empty;
            parts.Remove(item.Degree);
            var field = Regex.Match(item.Degree, @"^(.+?)\s+in\s+(.+)$", RegexOptions.IgnoreCase);
            if (field.Success)
            {
                item.Degree = field.Groups[1].Value;
                if (item.Major.Length == 0) item.Major = field.Groups[2].Value;
            }
            item.School = parts.FirstOrDefault(part => School.IsMatch(part)) ?? parts.FirstOrDefault() ?? string.Empty;
            parts.Remove(item.School);
            item.Location = parts.FirstOrDefault(part => part.Contains(',')) ?? parts.FirstOrDefault() ?? string.Empty;
            if (item.Degree.Length > 0 || item.School.Length > 0) education.Add(item);
        }
        return education;
    }
}
