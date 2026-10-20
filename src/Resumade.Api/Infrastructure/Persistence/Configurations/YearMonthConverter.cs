using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Resumade.Api.Models.Entities.Resumes;

namespace Resumade.Api.Infrastructure.Persistence.Configurations;

internal sealed class YearMonthConverter : ValueConverter<YearMonth?, int?>
{
    public YearMonthConverter() : base(
        value => value.HasValue ? value.Value.ToStorageValue() : null,
        value => value.HasValue ? YearMonth.FromStorageValue(value.Value) : null)
    {
    }
}
