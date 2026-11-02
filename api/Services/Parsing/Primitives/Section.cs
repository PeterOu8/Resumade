namespace Resumade.Api.Services.Parsing.Primitives
{
    internal enum SectionKind
    {
        Unknown, Profile, Summary, Skills, Experience, Projects, Education
    }

    internal sealed record Section(string SectionName,
        List<Line> Lines);
}
