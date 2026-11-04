using System.Text.Json;
using System.Text.Json.Nodes;

namespace Resumade.Api.Services.AI;

internal static class JsonSchemaValidator
{
    public static string? Validate(JsonElement value, JsonObject schema, string path = "$")
    {
        var allowedTypes = ReadTypes(schema);
        if (!MatchesType(value, allowedTypes))
            return $"{path} must be {string.Join(" or ", allowedTypes)}.";

        if (value.ValueKind == JsonValueKind.Null) return null;

        if (value.ValueKind == JsonValueKind.Object)
        {
            var properties = schema["properties"]?.AsObject() ?? new JsonObject();
            var required = schema["required"]?.AsArray()
                .Select(item => item?.GetValue<string>() ?? string.Empty)
                .ToHashSet(StringComparer.Ordinal) ?? [];
            var present = new HashSet<string>(StringComparer.Ordinal);
            foreach (var property in value.EnumerateObject())
            {
                if (!present.Add(property.Name)) return $"{path}.{property.Name} is duplicated.";
            }

            foreach (var name in required)
            {
                if (!present.Contains(name)) return $"{path}.{name} is required.";
            }

            foreach (var property in value.EnumerateObject())
            {
                if (!properties.TryGetPropertyValue(property.Name, out var childSchema) || childSchema is not JsonObject childObject)
                    return $"{path}.{property.Name} is not part of the Resumade schema.";

                var error = Validate(property.Value, childObject, $"{path}.{property.Name}");
                if (error is not null) return error;
            }
        }

        if (value.ValueKind == JsonValueKind.Array)
        {
            var itemSchema = schema["items"]?.AsObject();
            if (itemSchema is null) return $"{path} has no item schema.";
            var index = 0;
            foreach (var item in value.EnumerateArray())
            {
                if (index >= 200) return $"{path} contains too many items.";
                var error = Validate(item, itemSchema, $"{path}[{index}]");
                if (error is not null) return error;
                index++;
            }
        }

        if (value.ValueKind == JsonValueKind.String && value.GetString()!.Length > 20000)
            return $"{path} is too long.";

        return null;
    }

    private static IReadOnlyList<string> ReadTypes(JsonObject schema)
    {
        var type = schema["type"];
        if (type is JsonArray array)
            return array.Select(item => item?.GetValue<string>() ?? string.Empty).ToList();
        return [type?.GetValue<string>() ?? string.Empty];
    }

    private static bool MatchesType(JsonElement value, IReadOnlyList<string> allowed) => allowed.Any(type => type switch
    {
        "object" => value.ValueKind == JsonValueKind.Object,
        "array" => value.ValueKind == JsonValueKind.Array,
        "string" => value.ValueKind == JsonValueKind.String,
        "boolean" => value.ValueKind is JsonValueKind.True or JsonValueKind.False,
        "null" => value.ValueKind == JsonValueKind.Null,
        _ => false
    });
}
