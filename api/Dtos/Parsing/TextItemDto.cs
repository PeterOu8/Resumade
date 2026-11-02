namespace Resumade.Api.Dtos.Parsing
{
    public sealed record TextItemDto(
        string? Text,
        double? X,
        double? Y,
        double? Width,
        double? Height,
        string? FontName,
        bool? HasEOL
    );
}
