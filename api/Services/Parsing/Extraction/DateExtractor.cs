using System.Text.RegularExpressions;

namespace Resumade.Api.Services.ResumerParser
{
    public partial class ResumeParserService
    {
        private static string ExtractDate(string line, bool isStart)
        {
            var years = Regex.Matches(line, @"(19|20)\d{2}")
                .Select(m => m.Value)
                .ToList();

            if (years.Count == 0) return string.Empty;
            if (years.Count == 1) return isStart ? years[0] : string.Empty;
            return isStart ? years[0] : years[^1];
        }

        private static readonly Dictionary<string, string> MonthMap = new(StringComparer.OrdinalIgnoreCase)
        {
            // English
            ["jan"] = "01",
            ["january"] = "01",
            ["feb"] = "02",
            ["february"] = "02",
            ["mar"] = "03",
            ["march"] = "03",
            ["apr"] = "04",
            ["april"] = "04",
            ["may"] = "05",
            ["jun"] = "06",
            ["june"] = "06",
            ["jul"] = "07",
            ["july"] = "07",
            ["aug"] = "08",
            ["august"] = "08",
            ["sep"] = "09",
            ["sept"] = "09",
            ["september"] = "09",
            ["oct"] = "10",
            ["october"] = "10",
            ["nov"] = "11",
            ["november"] = "11",
            ["dec"] = "12",
            ["december"] = "12",
            // Spanish
            ["ene"] = "01",
            ["enero"] = "01",
            ["febrero"] = "02",
            ["marzo"] = "03",
            ["abr"] = "04",
            ["abril"] = "04",
            ["mayo"] = "05",
            ["junio"] = "06",
            ["julio"] = "07",
            ["ago"] = "08",
            ["agosto"] = "08",
            ["septiembre"] = "09",
            ["octubre"] = "10",
            ["noviembre"] = "11",
            ["dic"] = "12",
            ["diciembre"] = "12",
        };


    }
}
