namespace Resumade.Api.Dtos
{
    public sealed record TextItemDto(
        string Text,
        double X,
        double Y,
        double Width,
        double Height,
        string FontName,
        bool HasEOL);

    public sealed record LineDto(
        List<TextItemDto> Items);
    public sealed record PageDto(
        int PageNumber,
        List<TextItemDto> Items);

    public sealed record ParseResumeRequest(
        List<PageDto> Pages);
}
