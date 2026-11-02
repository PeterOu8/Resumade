using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;
using System.Text.RegularExpressions;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class SkillsExtractor
{
    internal static List<SkillDto> Extract(Section section)
    {
        var skills = new List<SkillDto>();
        var category = string.Empty;
        foreach (var line in section.Lines)
        {
            var text = ExtractionText.WithoutBullet(ExtractionText.Text(line));
            if (text.Length == 0) continue;
            var colon = text.IndexOf(':');
            if (colon >= 0)
            {
                category = text[..colon].Trim();
                text = text[(colon + 1)..].Trim();
            }
            else if (ExtractionText.IsBold(line) &&
                     !ExtractionText.IsBullet(ExtractionText.Text(line)) &&
                     Regex.IsMatch(text, @"^(?:(?:programming|technical|soft) )?(?:languages|skills|frameworks|tools|databases|cloud|platforms|frontend|backend|methodologies|other)$", RegexOptions.IgnoreCase))
            {
                category = text;
                continue;
            }
            var items = ExtractionText.SkillItems(text);
            if (items.Count > 0)
                Merge(skills, [new SkillDto { Category = category, Items = items }]);
        }
        return skills;
    }

    internal static void Merge(List<SkillDto> target, IEnumerable<SkillDto> source)
    {
        foreach (var skill in source)
        {
            var existing = target.FirstOrDefault(item =>
                item.Category.Equals(skill.Category, StringComparison.OrdinalIgnoreCase));
            if (existing is null) target.Add(skill);
            else existing.Items = existing.Items.Concat(skill.Items).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }
    }
}
