namespace Resumade.Api.Models.Entities.Resumes;

public readonly record struct YearMonth : IComparable<YearMonth>
{
    public YearMonth(int year, int month)
    {
        if (year is < 1 or > 9999)
            throw new ArgumentOutOfRangeException(nameof(year));
        if (month is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(month));

        Year = year;
        Month = month;
    }

    public int Year { get; }
    public int Month { get; }

    public int CompareTo(YearMonth other) => ToStorageValue().CompareTo(other.ToStorageValue());
    public int ToStorageValue() => (Year * 100) + Month;
    public static YearMonth FromStorageValue(int value) => new(value / 100, value % 100);
    public override string ToString() => $"{Year:D4}-{Month:D2}";
}
