using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Models.Dtos;

public class ResumeContentDto
{
    public PersonalInfoDto PersonalInfo { get; set; } = new();
    public string Summary { get; set; } = string.Empty;

    public List<SkillDto> KeySkills { get; set; } = [];

    public List<ResumeExperienceDto> Experience { get; set; } = [];

    public List<ResumeProjectDto> Projects { get; set; } = [];

    public List<ResumeEducationDto> Education { get; set; } = [];
}

public class PersonalInfoDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? LinkedIn { get; set; }
    public string? GitHub { get; set; }
    public string? Website { get; set; }
}

public class SkillDto
{
    public string Category { get; set; } = string.Empty;
    public List<string> Items { get; set; } = [];
}

public class ResumeExperienceDto
{
    public string Company { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string? EndDate { get; set; }
    public bool Current { get; set; }

    public List<string> Bullets { get; set; } = [];
}

public class ResumeProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? GitHub { get; set; }
    public List<string> TechStack { get; set; } = [];
}

public class ResumeEducationDto
{
    public string School { get; set; } = string.Empty;

    public string Degree { get; set; } = string.Empty;

    public string Major { get; set; } = string.Empty;

    public string StartDate { get; set; } = string.Empty;
    public string? EndDate { get; set; }
    public bool Current { get; set; }


    public string Location { get; set; } = string.Empty;

    public List<string> Awards { get; set; } = [];
}
