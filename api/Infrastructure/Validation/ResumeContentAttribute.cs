using System.ComponentModel.DataAnnotations;
using Resumade.Api.Dtos.Resumes;

namespace Resumade.Api.Infrastructure.Validation;

internal sealed class ResumeContentAttribute : ValidationAttribute
{
    public ResumeContentAttribute()
        : base("Resume content collections must not be null or contain null entries.")
    {
    }

    public override bool IsValid(object? value)
    {
        // MVC validates non-nullable properties, but skips null collection elements.
        return value is not ResumeContentDto content ||
            (content.KeySkills?.All(skill => skill is not null && HasNoNullEntries(skill.Items)) == true &&
             content.Experience?.All(experience => experience is not null && HasNoNullEntries(experience.Bullets)) == true &&
             content.Projects?.All(project => project is not null && HasNoNullEntries(project.TechStack)) == true &&
             content.Education?.All(education => education is not null && HasNoNullEntries(education.Awards)) == true &&
             content.AdditionalSections?.All(section => section is not null && HasNoNullEntries(section.Bullets)) == true);
    }

    private static bool HasNoNullEntries(List<string>? items) =>
        items?.All(item => item is not null) == true;
}
