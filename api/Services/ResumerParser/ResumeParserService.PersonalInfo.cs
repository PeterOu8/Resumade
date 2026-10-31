using Resumade.Api.Dtos.Resume;
using System.Text.RegularExpressions;

namespace Resumade.Api.Services.ResumerParser
{
    public partial class ResumeParserService
    {
        private PersonalInfoDto ExtractPersonalInfo(List<string> profileLines)
        {
            var info = new PersonalInfoDto();
            var text = string.Join("\n", profileLines);

            // Name – first non-empty line that looks like a name (letters, spaces, periods)
            var nameCandidate = profileLines
                .FirstOrDefault(l => Regex.IsMatch(l, @"^[A-Za-z\s\.]+$") && l.Split(' ').Length is >= 2 and <= 4);
            if (nameCandidate != null)
                info.FullName = nameCandidate.Trim();

            // Email
            var emailMatch = Regex.Match(text, @"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b");
            if (emailMatch.Success) info.Email = emailMatch.Value;

            // Phone (flexible US-style + international-ish)
            var phoneMatch = Regex.Match(text, @"(\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}");
            if (phoneMatch.Success) info.Phone = phoneMatch.Value.Trim();

            // Location – City, ST or City, Country
            var locMatch = Regex.Match(text, @"[A-Z][a-zA-Z\s]+,\s*[A-Z]{2,}");
            if (locMatch.Success) info.Location = locMatch.Value.Trim();

            // LinkedIn / GitHub / Website
            var linkedIn = Regex.Match(text, @"(?:linkedin\.com/in/|linkedin\.com/pub/)[^\s]+", RegexOptions.IgnoreCase);
            if (linkedIn.Success) info.LinkedIn = "https://" + linkedIn.Value.TrimStart('/');

            var github = Regex.Match(text, @"(?:github\.com/)[^\s]+", RegexOptions.IgnoreCase);
            if (github.Success) info.GitHub = "https://" + github.Value.TrimStart('/');

            var website = Regex.Match(text, @"https?://[^\s]+", RegexOptions.IgnoreCase);
            if (website.Success && !website.Value.Contains("linkedin") && !website.Value.Contains("github"))
                info.Website = website.Value;

            // Title – often the second line or a line under the name
            if (profileLines.Count > 1 && string.IsNullOrEmpty(info.Title))
            {
                var possibleTitle = profileLines.Skip(1).FirstOrDefault(l =>
                    !l.Contains("@") && !Regex.IsMatch(l, @"\d{3}") && l.Length < 60);
                if (possibleTitle != null) info.Title = possibleTitle.Trim();
            }

            return info;
        }
    }
}
