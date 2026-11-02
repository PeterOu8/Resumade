using System.Globalization;
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
        return new DateRange(NormaliseDate(match.Groups["start"].Value),
            end.Length == 0 || current ? null : NormaliseDate(end), current, match.Index, match.Length);
    }

    internal static string Remove(string text)
    {
        var date = Extract(text);
        return date is null ? text : text.Remove(date.Index, date.Length).Trim(' ', '|', ',', '–', '—', '-');
    }

    private static string NormaliseDate(string value)
    {
        if (Regex.IsMatch(value, $@"^{Year}$")) return value;

        var numeric = Regex.Match(value, $@"^(?<year>{Year})[-/](?<month>\d{{1,2}})$");
        if (!numeric.Success)
            numeric = Regex.Match(value, $@"^(?<month>\d{{1,2}})[-/](?<year>{Year})$");
        if (numeric.Success)
            return $"{numeric.Groups["year"].Value}-{int.Parse(numeric.Groups["month"].Value, CultureInfo.InvariantCulture):00}";

        var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var prefix = parts[0].TrimEnd('.').ToLowerInvariant()[..3];
        var month = prefix switch
        {
            "jan" or "ene" => 1, "feb" => 2, "mar" => 3, "apr" or "abr" => 4,
            "may" => 5, "jun" => 6, "jul" => 7, "aug" or "ago" => 8,
            "sep" => 9, "oct" => 10, "nov" => 11, "dec" or "dic" => 12,
            _ => 0
        };
        return $"{parts[^1]}-{month:00}";
    }
}
