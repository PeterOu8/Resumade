namespace Resumade.Api.Services.Parsing.Primitives
{
    internal sealed record Section(string SectionName,
        List<Line> Lines);
}
