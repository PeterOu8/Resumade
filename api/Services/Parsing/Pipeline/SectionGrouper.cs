using System.Text.RegularExpressions;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Pipeline
{
    internal static class SectionGrouper
    {
        private static readonly string[] SectionNames =
        {
            "experience", "education", "project", "skill",                       // Primary
            "job", "course", "extracurricular", "objective", "summary", "award", "honor", "project", // Secondary section names
            "certification", "publication", "interest", "activity", "volunteer",
        };

        public static List<Section> GroupLinesToSections(List<Line> lines)
        {
            var sections = new List<Section>();
            string currentName = "Profile";
            var currentLines = new List<Line>();

            void Flush()
            {
                if (currentLines.Count > 0)
                {
                    sections.Add(new Section(currentName, currentLines.ToList()));
                }
                currentLines.Clear();
            }

            for (var i = 0; i < lines.Count; i++)
            {
                var line = lines[i];
                if (IsSectionName(line, i))
                {
                    Flush();
                    currentName = line.Items[0].Text.Trim();
                }
                else
                {
                    currentLines.Add(line);
                }
            }
            Flush(); // Flush any remaining lines after the loop
            return sections;
        }

        private static bool IsSectionName(Line line, int lineNumber)
        {
            if (lineNumber < 2 || line.Items.Count > 1 || line.Items.Count == 0) return false;
            var item = line.Items[0];

            var isAllUpper = item.Text == item.Text.ToUpperInvariant();
            var isBold = item.FontName.ToLowerInvariant().Contains("bold", StringComparison.Ordinal);
            var hasLetter = item.Text.Any(Char.IsLetter);

            if (isBold && isAllUpper && hasLetter) return true;

            var text = item.Text.Trim();
            var atMostTwoWords = text.Split([ ' ', '\t', '\n', '\r' ], StringSplitOptions.RemoveEmptyEntries).Length <= 2;
            var startsWithCapital = text.Length > 0 && char.IsUpper(text[0]);
            var hasOnlyLettersSpacesAmpersands = Regex.IsMatch(text, @"^[a-zA-Z &]+$");

            return atMostTwoWords
                   && hasOnlyLettersSpacesAmpersands
                   && startsWithCapital
                   && SectionNames.Any(k => text.ToLowerInvariant().Contains(k, StringComparison.Ordinal));
        }
    }
}
