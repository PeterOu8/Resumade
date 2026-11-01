namespace Resumade.Api.Services.Parsing.Primitives
{
    internal sealed record TextItem(
        string Text,
        double X,
        double Y,
        double Width,
        double Height,
        string FontName,
        bool HasEOL);
}
