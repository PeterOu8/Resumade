using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Models;

public sealed record YearMonthResponse(int Year, int Month)
{
    public static YearMonthResponse? From(YearMonth? value) =>
        value is null ? null : new YearMonthResponse(value.Value.Year, value.Value.Month);
}
