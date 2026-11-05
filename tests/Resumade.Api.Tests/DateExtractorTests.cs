using Resumade.Api.Services.Parsing.Extraction;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class DateExtractorTests
{
    [Theory]
    [InlineData("Jan 2025 – Mar 2026", "Jan 2025", "Mar 2026")]
    [InlineData("January 2025 to March 2026", "January 2025", "March 2026")]
    [InlineData("2025-01 – 2026-03", "2025-01", "2026-03")]
    public void Extract_PreservesTheImportedDateText(string value, string start, string end)
    {
        var result = DateExtractor.Extract(value);

        Assert.NotNull(result);
        Assert.Equal(start, result.StartDate);
        Assert.Equal(end, result.EndDate);
    }
}
