using System.Text.RegularExpressions;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class ExtractionText
{
    private static readonly Regex Bullet = new(@"^\s*(?:[⋅∙•⦁⚫●⬤⚬○▪◦‣–*-]\s*|\d+[.)]\s+)");
    private static readonly Regex JobTitle = new(
        @"\b(engineer|developer|manager|analyst|designer|consultant|director|officer|specialist|coordinator|administrator|assistant|associate|intern|lead|architect|accountant|nurse|teacher|technician|scientist|researcher|founder|president|supervisor|representative)\b",
        RegexOptions.IgnoreCase);
    private static readonly Regex Url = new(
        @"(?:https?://|www\.|(?:github|linkedin)\.com/)[^\s|<>]+",
        RegexOptions.IgnoreCase);

    internal static string Text(Line line) =>
        string.Join(" ", line.Items.Select(item => item.Text.Trim()).Where(text => text.Length > 0)).Trim();

    internal static bool IsBullet(string text) => Bullet.IsMatch(text);
    internal static string WithoutBullet(string text) => Bullet.Replace(text, "", 1).Trim();
    internal static bool IsBold(Line line) =>
        line.Items.Any(item => item.FontName.Contains("bold", StringComparison.OrdinalIgnoreCase));
    internal static bool IsJobTitle(string text) => JobTitle.IsMatch(text);
    private static bool IsDetail(string text) => Regex.IsMatch(text,
        @"^(?:awards?|scholarships?|dean'?s list|honou?rs?|distinction|cum laude)\b|^(?:major|speciali[sz]ation|field of study)\s*:",
        RegexOptions.IgnoreCase);
    internal static bool IsSentence(string text) =>
        (text.EndsWith('.') && !Regex.IsMatch(text, @"\b(?:inc|ltd|co|corp|pty|b\.?sc|m\.?sc|ph\.?d)\.$", RegexOptions.IgnoreCase)) ||
        text.Split(' ').Length > 12 ||
        Regex.IsMatch(text, @"^(built|developed|designed|implemented|led|managed|created|maintained|improved|reduced|delivered|responsible|worked|supported|achieved|collaborated|automated|tested|deployed|migrated)\b", RegexOptions.IgnoreCase);

    internal static List<string> Parts(Line line, bool removeDates = true) =>
        line.Items.SelectMany(item => Regex.Split(removeDates ? DateExtractor.Remove(item.Text) : item.Text,
                @"\s*[|]\s*|\t+|\s+[–—-]\s+"))
            .Select(text => text.Trim(' ', '|', ',', '–', '—'))
            .Where(text => text.Length > 0).ToList();

    internal static List<string> SkillItems(string text) =>
        Regex.Split(WithoutBullet(text), @"\s*[,;|•]\s*")
            .Select(item => item.Trim()).Where(item => item.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase).ToList();

    internal static List<string> Links(string text) =>
        Url.Matches(text).Select(match => match.Value.TrimEnd('.', ',', ';', ')', ']'))
            .Distinct(StringComparer.OrdinalIgnoreCase).ToList();

    internal static string RemoveLinks(string text) => Url.Replace(text, "").Trim(' ', '|', ',', '(', ')');
    internal static string NormalizeUrl(string url) =>
        url.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? url : "https://" + url;

    internal static bool HasHost(string url, string host) =>
        Uri.TryCreate(NormalizeUrl(url), UriKind.Absolute, out var uri) &&
        (uri.Host.Equals(host, StringComparison.OrdinalIgnoreCase) ||
         uri.Host.EndsWith("." + host, StringComparison.OrdinalIgnoreCase));

    // Date anchors, explicit bullets, blank lines, and bold headings cover common
    // layouts without requiring a generic scoring engine or a trained model.
    internal static List<List<Line>> Entries(IReadOnlyList<Line> lines, bool dated = true)
    {
        var result = new List<List<Line>>();
        var current = new List<Line>();
        var hasBody = false;
        var afterBlank = false;
        var hasDate = false;

        void Flush()
        {
            if (current.Count > 0) result.Add(current);
            current = [];
            hasBody = false;
            hasDate = false;
        }

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            var text = Text(line);
            if (text.Length == 0)
            {
                afterBlank = true;
                continue;
            }

            var bullet = IsBullet(text);
            var detail = IsDetail(text);
            var date = !dated || bullet || detail || IsSentence(text) ? null : DateExtractor.Extract(text);
            var upcomingDate = dated && lines.Skip(i).Take(3)
                .TakeWhile(candidate => Text(candidate).Length > 0 && !IsBullet(Text(candidate)))
                .Any(candidate => !IsDetail(Text(candidate)) && !IsSentence(Text(candidate)) &&
                                  DateExtractor.Extract(Text(candidate)) is not null);
            var heading = !bullet && !detail && !IsSentence(text) &&
                          ((IsBold(line) && !text.Contains(':')) || upcomingDate || (afterBlank && text.Length < 100));

            if (current.Count > 0 && hasBody && heading)
                Flush();
            else if (current.Count > 0 && hasDate && date is not null)
            {
                // In entries without bullets, move the next entry's preceding
                // header lines along with its date instead of losing them.
                var start = current.Count;
                var seenTitle = false;
                while (DateExtractor.Remove(text).Length == 0 && start > 0 && current.Count - start < 3)
                {
                    var previous = Text(current[start - 1]);
                    if (IsBullet(previous) || IsSentence(previous) || DateExtractor.Extract(previous) is not null)
                        break;
                    if (IsJobTitle(previous) && seenTitle) break;
                    seenTitle |= IsJobTitle(previous);
                    start--;
                }
                var pending = current.Skip(start).ToList();
                current.RemoveRange(start, current.Count - start);
                Flush();
                current.AddRange(pending);
            }

            current.Add(line);
            hasDate |= date is not null;
            hasBody |= bullet || detail || IsSentence(text) || (!dated && current.Count > 1);
            afterBlank = false;
        }
        Flush();
        return result;
    }

    internal static List<string> Bullets(IEnumerable<Line> lines)
    {
        var result = new List<string>();
        var previousWasBullet = false;
        foreach (var line in lines)
        {
            var text = Text(line);
            if (text.Length == 0)
            {
                previousWasBullet = false;
                continue;
            }
            if (IsBullet(text))
            {
                var value = WithoutBullet(text);
                if (value.Length > 0) result.Add(value);
                previousWasBullet = value.Length > 0;
            }
            else if (previousWasBullet && result.Count > 0)
                result[^1] += " " + text;
            else
                result.Add(text);
        }
        return result;
    }

    internal static int BodyStart(IReadOnlyList<Line> lines)
    {
        for (var i = 0; i < lines.Count; i++)
        {
            var text = Text(lines[i]);
            if (IsBullet(text) || (i > 0 && IsSentence(text)))
                return i;
        }
        return lines.Count;
    }
}
