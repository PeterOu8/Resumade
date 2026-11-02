using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;
using Resumade.Api.Services.Parsing.Pipeline;
using Resumade.Api.Services.Parsing.Extraction;

namespace Resumade.Api.Services.Parsing
{
    public sealed class ResumeParserService
    {

        internal ResumeContentDto Parse(List<TextItem> items)
        {
            var textItems = TextItemMapper.MapTextItems(items);
            var lines = LineGrouper.GroupTextToLines(textItems);
            var sections = SectionGrouper.GroupLinesToSections(lines);

            return new ResumeContentDto
            {
                Profile = ProfileExtractor.Extract(sections.Get(SectionKind.Header)),
                Summary = SummaryExtractor.Extract(sections.Get(SectionKind.Summary)),
                KeySkills = SkillsExtractor.Extract(sections.Get(SectionKind.Skills)),
                Experience = ExperienceExtractor.Extract(sections.Get(SectionKind.Experience)),
                Projects = ProjectExtractor.Extract(sections.Get(SectionKind.Projects)),
                Education = EducationExtractor.Extract(sections.Get(SectionKind.Education)),
            };
        }

    }
}
