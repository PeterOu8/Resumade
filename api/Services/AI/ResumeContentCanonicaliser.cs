using System.Text.Json.Nodes;

namespace Resumade.Api.Services.AI;

internal static class ResumeContentCanonicaliser
{
    public static void Apply(JsonNode content)
    {
        if (content is not JsonObject root || root["projects"] is not JsonArray projects)
            return;

        foreach (var projectNode in projects)
        {
            if (projectNode is not JsonObject project ||
                project["bullets"] is not JsonArray bullets ||
                project["description"] is not JsonValue descriptionValue ||
                !descriptionValue.TryGetValue<string>(out var description))
                continue;

            var bulletText = new List<string>();
            var valid = true;
            foreach (var bullet in bullets)
            {
                if (bullet is not JsonValue value || !value.TryGetValue<string>(out var text))
                {
                    valid = false;
                    break;
                }

                if (!string.IsNullOrWhiteSpace(text)) bulletText.Add(text.Trim());
            }

            if (!valid) continue;

            var details = string.Join(" ", bulletText);
            project["description"] = string.Join(
                " ",
                new[] { description.Trim(), details }.Where(value => value.Length > 0));
            project.Remove("bullets");
        }
    }
}
