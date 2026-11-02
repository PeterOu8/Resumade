using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class SummaryExtractor
{
    internal static string Extract(Section section)
    {
        var paragraphs = new List<string>();
        var current = new List<string>();
        foreach (var line in section.Lines)
        {
            var text = ExtractionText.Text(line);
            if (text.Length == 0)
            {
                if (current.Count > 0) paragraphs.Add(string.Join(" ", current));
                current.Clear();
            }
            else
                current.Add(text);
        }
        if (current.Count > 0) paragraphs.Add(string.Join(" ", current));
        return string.Join("\n\n", paragraphs);
    }
}
