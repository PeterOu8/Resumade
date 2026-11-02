using System.Text.RegularExpressions;
using Resumade.Api.Services.Parsing.Primitives;
using Resumade.Api.Services.Parsing.Extraction;

namespace Resumade.Api.Services.Parsing.Pipeline;

internal static class SectionGrouper
{
    // Exact aliases avoid treating "Project Manager" or a sentence as a heading.
    private static readonly Dictionary<string, SectionKind> Headings = new(StringComparer.OrdinalIgnoreCase)
    {
        ["profile"] = SectionKind.Profile, ["contact"] = SectionKind.Profile,
        ["contact information"] = SectionKind.Profile, ["personal information"] = SectionKind.Profile,
        ["summary"] = SectionKind.Summary, ["professional summary"] = SectionKind.Summary,
        ["career summary"] = SectionKind.Summary, ["profile summary"] = SectionKind.Summary,
        ["objective"] = SectionKind.Summary, ["career objective"] = SectionKind.Summary,
        ["professional profile"] = SectionKind.Summary, ["about me"] = SectionKind.Summary,
        ["skills"] = SectionKind.Skills, ["key skills"] = SectionKind.Skills,
        ["technical skills"] = SectionKind.Skills, ["core skills"] = SectionKind.Skills,
        ["sales and technical skills"] = SectionKind.Skills,
        ["core competencies"] = SectionKind.Skills, ["competencies"] = SectionKind.Skills,
        ["skills and expertise"] = SectionKind.Skills, ["skills and abilities"] = SectionKind.Skills,
        ["skills and technologies"] = SectionKind.Skills,
        ["experience"] = SectionKind.Experience, ["work experience"] = SectionKind.Experience,
        ["professional experience"] = SectionKind.Experience, ["employment"] = SectionKind.Experience,
        ["employment history"] = SectionKind.Experience, ["work history"] = SectionKind.Experience,
        ["career history"] = SectionKind.Experience, ["relevant experience"] = SectionKind.Experience,
        ["project"] = SectionKind.Projects, ["projects"] = SectionKind.Projects,
        ["personal projects"] = SectionKind.Projects, ["selected projects"] = SectionKind.Projects,
        ["academic projects"] = SectionKind.Projects, ["technical projects"] = SectionKind.Projects,
        ["education"] = SectionKind.Education, ["academic background"] = SectionKind.Education,
        ["educational background"] = SectionKind.Education, ["qualifications"] = SectionKind.Education,
        ["education and qualifications"] = SectionKind.Education,
        // These headings are preserved as additional sections.
        ["certifications"] = SectionKind.Unknown, ["certification"] = SectionKind.Unknown,
        ["awards"] = SectionKind.Unknown, ["honors"] = SectionKind.Unknown,
        ["honours"] = SectionKind.Unknown, ["publications"] = SectionKind.Unknown,
        ["interests"] = SectionKind.Unknown, ["activities"] = SectionKind.Unknown,
        ["volunteering"] = SectionKind.Unknown, ["volunteer experience"] = SectionKind.Unknown,
        ["references"] = SectionKind.Unknown, ["languages"] = SectionKind.Unknown,
        ["extracurricular activities"] = SectionKind.Unknown
    };

    private static string Normalize(string name) =>
        Regex.Replace(name.Trim().TrimEnd(':').Replace("&", "and"), @"\s+", " ");

    internal static SectionKind Classify(string name) =>
        Headings.GetValueOrDefault(Normalize(name), SectionKind.Unknown);

    public static List<Section> GroupLinesToSections(List<Line> lines)
    {
        var sections = new List<Section>();
        var name = "Profile";
        var currentLines = new List<Line>();

        var knownHeadings = lines.Where(line =>
            Classify(ExtractionText.Text(line)) is not (SectionKind.Unknown or SectionKind.Profile)).ToList();
        var bodyHeight = lines.SelectMany(line => line.Items)
            .Where(item => !string.IsNullOrWhiteSpace(item.Text) && item.Height > 0)
            .GroupBy(item => item.Height)
            .OrderByDescending(group => group.Sum(item => item.Text.Length))
            .Select(group => group.Key).FirstOrDefault();
        var firstContentLine = lines.FindIndex(line => ExtractionText.Text(line).Length > 0);

        void Flush()
        {
            if (currentLines.Any(line => line.Items.Any(item => !string.IsNullOrWhiteSpace(item.Text))))
                sections.Add(new Section(name, currentLines.ToList()));
            currentLines.Clear();
        }

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            var text = ExtractionText.Text(line);
            // "Languages:" can also be a category inside a skills section.
            var skillCategory = Classify(name) == SectionKind.Skills &&
                                Normalize(text).Equals("Languages", StringComparison.OrdinalIgnoreCase);
            if (!skillCategory && (Headings.ContainsKey(Normalize(text)) ||
                (i > firstContentLine && IsUnfamiliarHeading(lines, i, knownHeadings, bodyHeight))))
            {
                Flush();
                name = text;
            }
            else
            {
                currentLines.Add(line);
            }
        }

        Flush();
        return sections;
    }

    private static bool IsUnfamiliarHeading(List<Line> lines, int index, List<Line> knownHeadings, double bodyHeight)
    {
        var line = lines[index];
        var text = ExtractionText.Text(line).TrimEnd(':');
        if (text.Length is 0 or > 80 || text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length > 8 ||
            !Regex.IsMatch(text, @"^[\p{L}\p{M}\d &/()'’–—-]+$") || !text.Any(char.IsLetter) ||
            ExtractionText.IsBullet(text) || ExtractionText.IsJobTitle(text))
            return false;

        var height = line.Items.Max(item => item.Height);
        var bold = ExtractionText.IsBold(line);
        // Compare against actual section styles so a smaller bold entry title
        // (such as the location below Business Exposure) stays in its section.
        var matchesHeadingStyle = knownHeadings.Any(heading =>
            Math.Abs(height - heading.Items.Max(item => item.Height)) <= 0.25 &&
            (bold && ExtractionText.IsBold(heading) || line.Items.Any(item =>
                heading.Items.Any(reference => reference.FontName == item.FontName))));
        var separated = index > 0 && (lines[index - 1].Items.Count == 0 ||
            Math.Abs(line.Items[0].Y - lines[index - 1].Items[0].Y) > Math.Max(height, bodyHeight) * 1.5);
        var allUpper = text == text.ToUpperInvariant();
        var largerThanBody = height > bodyHeight + 0.5;

        return knownHeadings.Count > 0
            ? matchesHeadingStyle && (allUpper || largerThanBody || separated)
            : bold && allUpper && (largerThanBody || separated);
    }
}
