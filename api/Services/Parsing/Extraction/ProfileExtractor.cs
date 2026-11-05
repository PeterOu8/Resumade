using System.Text.RegularExpressions;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.Parsing.Primitives;

namespace Resumade.Api.Services.Parsing.Extraction;

internal static class ProfileExtractor
{
    private static readonly Regex Email = new(@"[\p{L}\d.!#$%&'*+/=?^_{|}~-]+@[\p{L}\d-]+(?:\.[\p{L}\d-]+)+");
    private static readonly Regex Phone = new(@"(?<!\w)(?:\+?\d[\d ().-]{6,}\d)(?!\w)");

    internal static ProfileDto Extract(Section section)
    {
        var profile = new ProfileDto();
        var text = string.Join("\n", section.Lines.Select(ExtractionText.Text));
        profile.Email = Email.Match(text).Value;
        profile.Phone = Phone.Matches(text).Select(match => match.Value.Trim())
            .FirstOrDefault(value => value.Count(char.IsDigit) is >= 8 and <= 15 &&
                                     DateExtractor.Extract(value) is null) ?? string.Empty;

        foreach (var link in ExtractionText.Links(text))
        {
            var url = ExtractionText.NormaliseUrl(link);
            if (ExtractionText.HasHost(url, "linkedin.com")) profile.LinkedIn ??= url;
            else if (ExtractionText.HasHost(url, "github.com")) profile.GitHub ??= url;
            else profile.Website ??= url;
        }

        var candidates = section.Lines.SelectMany(line =>
            ExtractionText.Parts(line, removeDates: false).Select(part => new
            {
                Text = Phone.Replace(Email.Replace(ExtractionText.RemoveLinks(part), ""), "").Trim(' ', ',', '|'),
                Height = line.Items.Count == 0 ? 0 : line.Items.Max(item => item.Height)
            })).Where(part => part.Text.Length > 0).ToList();

        var explicitName = candidates.FirstOrDefault(part => part.Text.StartsWith("Name:", StringComparison.OrdinalIgnoreCase));
        profile.FullName = explicitName is not null ? explicitName.Text[5..].Trim() :
            candidates.Where(part => !ExtractionText.IsJobTitle(part.Text) &&
                Regex.IsMatch(part.Text, @"^[\p{L}][\p{L}\p{M}'’.-]*(?:\s+[\p{L}\p{M}'’.-]+){1,5}$"))
                .OrderByDescending(part => part.Height).Select(part => part.Text).FirstOrDefault() ?? string.Empty;

        profile.Title = candidates.Select(part => part.Text)
            .FirstOrDefault(value => value != profile.FullName && ExtractionText.IsJobTitle(value)) ?? string.Empty;
        profile.Title = Regex.Replace(profile.Title, @"^(?:title|role)\s*:\s*", "", RegexOptions.IgnoreCase);

        var location = candidates.Select(part => part.Text).FirstOrDefault(value =>
            Regex.IsMatch(value, @"^(?:location|address|based in)\s*:", RegexOptions.IgnoreCase));
        location ??= candidates.Select(part => part.Text).FirstOrDefault(value =>
            value != profile.FullName && value != profile.Title && !value.Contains(':') &&
            (value.Contains(',') || value.Equals("Remote", StringComparison.OrdinalIgnoreCase)));
        profile.Location = location is null ? string.Empty :
            Regex.Replace(location, @"^(?:location|address|based in)\s*:\s*", "", RegexOptions.IgnoreCase);
        return profile;
    }
}
