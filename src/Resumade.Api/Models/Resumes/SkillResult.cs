namespace Resumade.Api.Models.Resumes;

public sealed record SkillResult(Guid Id, string Name, string? Category, string? Proficiency,
    decimal? YearsExperience, int SortOrder);
