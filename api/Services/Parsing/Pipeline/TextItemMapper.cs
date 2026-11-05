using System.Text;
using System.Text.RegularExpressions;
using Resumade.Api.Dtos.Parsing;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Pipeline;

internal static class TextItemMapper
{
    private static readonly Regex HorizontalWhitespace =
        new(@"[^\S\r\n\u0085\u2028\u2029]+", RegexOptions.Compiled);
    private const int MaxTextLength = 10_000;
    private const int MaxFontNameLength = 256;
    private const int MaxItems = 50_000;
    public static List<TextItem> MapTextItems(
        IReadOnlyList<TextItemDto> items)
    {
        return items.Select(item => new TextItem(
            item.Text ?? throw new InvalidOperationException(
                "Text must be validated before mapping."),
            item.X ?? throw new InvalidOperationException(
                "X must be validated before mapping."),
            item.Y ?? throw new InvalidOperationException(
                "Y must be validated before mapping."),
            item.Width ?? throw new InvalidOperationException(
                "Width must be validated before mapping."),
            item.Height ?? throw new InvalidOperationException(
                "Height must be validated before mapping."),
            item.FontName ?? string.Empty,
            item.HasEOL ?? throw new InvalidOperationException(
                "HasEOL must be validated before mapping.")
        )).ToList();
    }


    public static TextItemDto Sanitise(TextItemDto item)
    {
        return item with
        {
            Text = Normalise(item.Text
                             ?? throw new ArgumentException("Text is required.")),

            FontName = item.FontName?.Trim() ?? string.Empty
        };
    }

    public static string Normalise(string? text)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;

        var sb = new StringBuilder(text.Length);

        foreach (var ch in text)
        {
            switch (ch)
            {
                // Remove unwanted invisible characters
                case '\u00AD':
                case '\u200B':
                case '\uFEFF':
                    continue;

                // Expand common ligatures
                case '\uFB00': sb.Append("ff"); break;
                case '\uFB01': sb.Append("fi"); break;
                case '\uFB02': sb.Append("fl"); break;
                case '\uFB03': sb.Append("ffi"); break;
                case '\uFB04': sb.Append("ffl"); break;

                // Normalise quotation marks
                case '\u2018':
                case '\u2019':
                    sb.Append('\'');
                    break;

                case '\u201C':
                case '\u201D':
                    sb.Append('"');
                    break;

                default:
                    sb.Append(ch);
                    break;
            }
        }

        return sb.ToString();
    }
}
