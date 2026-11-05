using System.Globalization;
using Resumade.Api.Dtos.Resumes;

namespace Resumade.Api.Services.Resume;

internal readonly record struct ResumeCursor(DateTime UpdatedAt, Guid Id)
{
    public static ResumeCursor From(ResumeSummaryDto resume) =>
        new(resume.UpdatedAt, resume.Id);

    public static bool TryParse(string? value, out ResumeCursor cursor)
    {
        cursor = default;
        if (value is null) return true;

        var parts = value.Split(':');
        if (parts.Length != 2 ||
            !long.TryParse(parts[0], NumberStyles.None, CultureInfo.InvariantCulture, out var ticks) ||
            ticks < DateTime.MinValue.Ticks ||
            ticks > DateTime.MaxValue.Ticks ||
            !Guid.TryParseExact(parts[1], "D", out var id))
        {
            return false;
        }

        cursor = new ResumeCursor(new DateTime(ticks, DateTimeKind.Utc), id);
        return true;
    }

    public override string ToString() =>
        FormattableString.Invariant($"{UpdatedAt.Ticks}:{Id:D}");
}
