using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class AdditionalSectionExtractor
{
    internal static ResumeAdditionalSectionDto Extract(Section section)
    {
        var contentLines = new List<Line>();
        var bulletLines = new List<Line>();
        var inBullet = false;

        foreach (var line in section.Lines)
        {
            var text = ExtractionText.Text(line);
            if (text.Length == 0)
            {
                // A blank line ends a bullet run and preserves a paragraph break.
                contentLines.Add(line);
                bulletLines.Add(line);
                inBullet = false;
            }
            else if (ExtractionText.IsBullet(text))
            {
                bulletLines.Add(line);
                inBullet = true;
            }
            else if (inBullet)
            {
                // Match experience extraction: unmarked continuation lines belong
                // to the preceding bullet until a blank line or another bullet.
                bulletLines.Add(line);
            }
            else
            {
                contentLines.Add(line);
            }
        }

        return new ResumeAdditionalSectionDto
        {
            Title = section.SectionName,
            Content = SummaryExtractor.Extract(new Section(section.SectionName, contentLines)),
            Bullets = ExtractionText.Bullets(bulletLines)
        };
    }
}
