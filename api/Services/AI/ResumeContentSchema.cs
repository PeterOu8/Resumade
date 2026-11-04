using System.Text.Json.Nodes;

namespace Resumade.Api.Services.AI;

internal static class ResumeContentSchema
{
    private static JsonObject String() => new() { ["type"] = "string" };

    private static JsonObject NullableString() => new()
    {
        ["type"] = new JsonArray("string", "null")
    };

    private static JsonObject Boolean() => new() { ["type"] = "boolean" };

    private static JsonObject Array(JsonNode item) => new()
    {
        ["type"] = "array",
        ["items"] = item
    };

    private static JsonObject Object(params (string Name, JsonNode Schema)[] properties)
    {
        var propertySchemas = new JsonObject();
        var required = new JsonArray();
        foreach (var (name, schema) in properties)
        {
            propertySchemas[name] = schema.DeepClone();
            required.Add(name);
        }

        return new JsonObject
        {
            ["type"] = "object",
            ["properties"] = propertySchemas,
            ["required"] = required,
            ["additionalProperties"] = false
        };
    }

    public static JsonObject Create()
    {
        var dateRange = new (string Name, JsonNode Schema)[]
        {
            ("startDate", String()),
            ("endDate", NullableString()),
            ("current", Boolean())
        };

        return Object(
            ("profile", Object(
                ("fullName", String()),
                ("email", String()),
                ("phone", String()),
                ("location", String()),
                ("title", String()),
                ("linkedIn", NullableString()),
                ("gitHub", NullableString()),
                ("website", NullableString()))),
            ("summary", String()),
            ("keySkills", Array(Object(
                ("category", String()),
                ("items", Array(String()))))),
            ("experience", Array(Object(
                ("company", String()),
                ("title", String()),
                ("location", String()),
                dateRange[0],
                dateRange[1],
                dateRange[2],
                ("bullets", Array(String()))))),
            ("projects", Array(Object(
                ("name", String()),
                ("description", String()),
                ("url", NullableString()),
                ("gitHub", NullableString()),
                ("techStack", Array(String()))))),
            ("education", Array(Object(
                ("school", String()),
                ("degree", String()),
                ("major", String()),
                ("location", String()),
                dateRange[0],
                dateRange[1],
                dateRange[2],
                ("awards", Array(String()))))),
            ("additionalSections", Array(Object(
                ("title", String()),
                ("content", String()),
                ("bullets", Array(String())))))
        );
    }
}
