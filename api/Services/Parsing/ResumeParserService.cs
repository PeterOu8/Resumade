using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Extraction;
using Resumade.Api.Services.Parsing.Pipeline;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing;

public sealed class ResumeParserService
{
    internal ResumeContentDto Parse(IReadOnlyList<TextItem> items)
    {
        var lines = LineGrouper.GroupTextToLines(items);
        return Extract(SectionGrouper.GroupLinesToSections(lines));
    }

    internal static ResumeContentDto Extract(IReadOnlyList<Section> sections)
    {
        var content = new ResumeContentDto();
        var profileLines = new List<Line>();
        var summaries = new List<string>();

        // Keep repeated sections separate so entries retain document order.
        foreach (var section in sections)
        {
            switch (SectionGrouper.Classify(section.SectionName))
            {
                case SectionKind.Profile:
                    profileLines.AddRange(section.Lines);
                    break;
                case SectionKind.Summary:
                    var summary = SummaryExtractor.Extract(section);
                    if (summary.Length > 0) summaries.Add(summary);
                    break;
                case SectionKind.Skills:
                    SkillsExtractor.Merge(content.KeySkills, SkillsExtractor.Extract(section));
                    break;
                case SectionKind.Experience:
                    content.Experience.AddRange(ExperienceExtractor.Extract(section));
                    break;
                case SectionKind.Projects:
                    content.Projects.AddRange(ProjectExtractor.Extract(section));
                    break;
                case SectionKind.Education:
                    content.Education.AddRange(EducationExtractor.Extract(section));
                    break;
                case SectionKind.Unknown:
                    content.AdditionalSections.Add(AdditionalSectionExtractor.Extract(section));
                    break;
            }
        }

        content.Profile = ProfileExtractor.Extract(new Section("Profile", profileLines));
        content.Summary = string.Join("\n\n", summaries);
        return content;
    }
}
