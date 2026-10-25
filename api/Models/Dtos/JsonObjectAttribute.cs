using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Resumade.Api.Models.Dtos;

public sealed class JsonObjectAttribute : ValidationAttribute
{
    public JsonObjectAttribute() : base("ContentJson must be a valid JSON object.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not string json) return false;
        try
        {
            using var document = JsonDocument.Parse(json);
            return document.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException) { return false; }
    }
}

