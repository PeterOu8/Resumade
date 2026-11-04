using System.Text.Json;
using System.Text.Json.Nodes;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.AI;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class AiResumeSchemaTests
{
    [Fact]
    public void Validate_AcceptsCompleteResumadeContent()
    {
        var content = new ResumeContentDto
        {
            Profile = new ProfileDto
            {
                FullName = "Alex Morgan",
                Email = "alex@example.test",
                Phone = "",
                Location = "Sydney",
                Title = "Software Engineer"
            },
            Summary = "Builds dependable products."
        };
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(
            content,
            new JsonSerializerOptions(JsonSerializerDefaults.Web)));

        var error = JsonSchemaValidator.Validate(
            document.RootElement,
            ResumeContentSchema.Create());

        Assert.Null(error);
    }

    [Fact]
    public void Validate_RejectsMissingFieldsAndProviderExtras()
    {
        var schema = ResumeContentSchema.Create();
        using var missingDocument = JsonDocument.Parse("""{"profile":{}}""");

        var missingError = JsonSchemaValidator.Validate(
            missingDocument.RootElement,
            schema);

        Assert.Contains("required", missingError);

        var complete = JsonNode.Parse("""
            {
              "profile": { "fullName": "", "email": "", "phone": "", "location": "", "title": "", "linkedIn": null, "gitHub": null, "website": null },
              "summary": "",
              "keySkills": [],
              "experience": [],
              "projects": [],
              "education": [],
              "additionalSections": [],
              "providerNote": "not allowed"
            }
            """)!;
        ResumeContentCanonicaliser.Apply(complete);
        using var extraDocument = JsonDocument.Parse(complete.ToJsonString());

        var extraError = JsonSchemaValidator.Validate(
            extraDocument.RootElement,
            schema);

        Assert.Contains("not part of the Resumade schema", extraError);
    }

    [Fact]
    public void Tailoring_PreservesIdentityAndCareerFacts()
    {
        var source = new ResumeContentDto
        {
            Profile = new ProfileDto { FullName = "Alex", Email = "alex@example.test", Title = "Engineer" },
            Experience =
            [
                new ResumeExperienceDto
                {
                    Company = "Example Co",
                    Title = "Engineer",
                    StartDate = "2024-01",
                    Current = true,
                    Bullets = ["Built products."]
                }
            ]
        };
        var tailored = new ResumeContentDto
        {
            Profile = new ProfileDto { FullName = "Changed", Email = "changed@example.test", Title = "Senior Engineer" },
            Experience =
            [
                new ResumeExperienceDto
                {
                    Company = "Invented Co",
                    Title = "Director",
                    StartDate = "2020-01",
                    Current = false,
                    Bullets = ["Built relevant products."]
                }
            ]
        };

        AiResumeService.PreserveProtectedFacts(source, tailored);

        Assert.Equal("Alex", tailored.Profile.FullName);
        Assert.Equal("alex@example.test", tailored.Profile.Email);
        Assert.Equal("Senior Engineer", tailored.Profile.Title);
        Assert.Equal("Example Co", tailored.Experience[0].Company);
        Assert.Equal("Engineer", tailored.Experience[0].Title);
        Assert.Equal("Built relevant products.", tailored.Experience[0].Bullets[0]);
    }

    [Fact]
    public void Canonicalize_FoldsProjectBulletsIntoDescriptionBeforeValidation()
    {
        var content = JsonNode.Parse("""
            {
              "profile": { "fullName": "", "email": "", "phone": "", "location": "", "title": "", "linkedIn": null, "gitHub": null, "website": null },
              "summary": "",
              "keySkills": [],
              "experience": [],
              "projects": [{ "name": "Resumade", "description": "Resume builder.", "url": null, "gitHub": null, "techStack": [], "bullets": ["Added AI tailoring.", "Validated structured output."] }],
              "education": [],
              "additionalSections": []
            }
            """)!;

        ResumeContentCanonicaliser.Apply(content);
        using var document = JsonDocument.Parse(content.ToJsonString());
        var validationError = JsonSchemaValidator.Validate(
            document.RootElement,
            ResumeContentSchema.Create());

        Assert.Null(validationError);
        Assert.Equal(
            "Resume builder. Added AI tailoring. Validated structured output.",
            content["projects"]![0]!["description"]!.GetValue<string>());
        Assert.Null(content["projects"]![0]!["bullets"]);
    }
}
