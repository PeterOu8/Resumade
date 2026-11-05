using System.Text.RegularExpressions;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class DateExtractor
{
    private const string Year = @"(?:19|20)\d{2}";
    private const string Month = @"(?:jan(?:uary)?|feb(?:ruary|rero)?|mar(?:ch|zo)?|apr(?:il)?|may(?:o)?|jun(?:e|io)?|jul(?:y|io)?|aug(?:ust)?|sep(?:t(?:ember|iembre)?)?|oct(?:ober|ubre)?|nov(?:ember|iembre)?|dec(?:ember)?|ene(?:ro)?|abr(?:il)?|ago(?:sto)?|dic(?:iembre)?)";
    private const string Date = $@"(?:{Month}\.?\s+{Year}|{Year}[-/](?:0?[1-9]|1[0-2])|(?:0?[1-9]|1[0-2])[-/]{Year}|{Year})";
    private static readonly Regex Pattern = new(
        $@"(?<![\p{{L}}\d/])(?<start>{Date})(?:\s*(?:[-–—−]|to|until)\s*(?<end>{Date}|present|current|now))?(?![\p{{L}}\d/])",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    internal sealed record DateRange(string StartDate, string? EndDate, bool Current, int Index, int Length);

    internal static DateRange? Extract(string text)
    {
        var match = Pattern.Match(text);
        if (!match.Success) return null;

        var end = match.Groups["end"].Value;
        var current = Regex.IsMatch(end, @"^(present|current|now)$", RegexOptions.IgnoreCase);
        return new DateRange(match.Groups["start"].Value.Trim(),
            end.Length == 0 || current ? null : end.Trim(), current, match.Index, match.Length);
    }

    internal static string Remove(string text)
    {
        var date = Extract(text);
        return date is null ? text : text.Remove(date.Index, date.Length).Trim(' ', '|', ',', '–', '—', '-');
    }
}
