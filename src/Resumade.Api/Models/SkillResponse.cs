using Resumade.Api.Models.Resumes;

namespace Resumade.Api.Models;

public sealed record SkillResponse(Guid Id, string Name, string? Category, string? Proficiency,
    decimal? YearsExperience, int SortOrder)
{
    public static SkillResponse From(SkillResult result) => new(
        result.Id, result.Name, result.Category, result.Proficiency, result.YearsExperience, result.SortOrder);
}
