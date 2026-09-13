using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Resumade.Domain.Resumes;

namespace Resumade.Infrastructure.Persistence.Configurations;

internal sealed class YearMonthConverter : ValueConverter<YearMonth?, int?>
{
    public YearMonthConverter() : base(
        value => value.HasValue ? value.Value.ToStorageValue() : null,
        value => value.HasValue ? YearMonth.FromStorageValue(value.Value) : null)
    {
    }
}
