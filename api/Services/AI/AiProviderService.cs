using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Resumade.Api.Dtos.AI;
using Resumade.Api.Dtos.Resumes;

namespace Resumade.Api.Services.AI;

public sealed class AiProviderService(HttpClient httpClient)
{
    private const int MaxProviderResponseBytes = 1_000_000;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = false
    };

    private static readonly IReadOnlyDictionary<string, string> DefaultModels = new Dictionary<string, string>
    {
        ["openai"] = "gpt-6-astra",
        ["claude"] = "claude-sonnet-4-5-20250929",
        ["grok"] = "grok-4.7",
        ["gemini"] = "gemini-3.8-flash",
        ["deepseek"] = "deepseek-flash"
    };

    public async Task<ResumeContentDto> CompleteAsync(
        AiConnectionDto connection,
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken)
    {
        var provider = connection.Provider.Trim().ToLowerInvariant();
        if (!DefaultModels.TryGetValue(provider, out var defaultModel))
            throw new AiProviderException("Choose a supported AI provider.", StatusCodes.Status400BadRequest);

        var apiKey = connection.ApiKey.Trim();
        if (apiKey.Length < 8 || apiKey.Any(char.IsControl))
            throw new AiProviderException("The API key is invalid.", StatusCodes.Status400BadRequest);

        var model = string.IsNullOrWhiteSpace(connection.Model) ? defaultModel : connection.Model.Trim();
        if (model.Length > 120 || model.Any(character => !(char.IsLetterOrDigit(character) || "-._:".Contains(character))))
            throw new AiProviderException("The model name is invalid.", StatusCodes.Status400BadRequest);

        var schema = ResumeContentSchema.Create();
        using var request = provider switch
        {
            "openai" => CreateOpenAiRequest(apiKey, model, systemPrompt, userPrompt, schema),
            "claude" => CreateClaudeRequest(apiKey, model, systemPrompt, userPrompt, schema),
            "grok" => CreateChatCompletionsRequest("https://api.x.ai/v1/chat/completions", apiKey, model, systemPrompt, userPrompt, schema, true),
            "gemini" => CreateGeminiRequest(apiKey, model, systemPrompt, userPrompt, schema),
            "deepseek" => CreateChatCompletionsRequest("https://api.deepseek.com/chat/completions", apiKey, model, systemPrompt, userPrompt, schema, false),
            _ => throw new AiProviderException("Choose a supported AI provider.", StatusCodes.Status400BadRequest)
        };

        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(httpClient.Timeout);
        try
        {
            return await ReadProviderResponseAsync(request, provider, schema, deadline.Token);
        }
        catch (OperationCanceledException error) when (!cancellationToken.IsCancellationRequested &&
            (deadline.IsCancellationRequested || error.InnerException is TimeoutException))
        {
            throw new AiProviderException("The AI provider timed out.", StatusCodes.Status504GatewayTimeout);
        }
        catch (HttpRequestException)
        {
            throw new AiProviderException("The AI provider could not be reached.");
        }
    }

    private async Task<ResumeContentDto> ReadProviderResponseAsync(
        HttpRequestMessage request, string provider, JsonObject schema, CancellationToken cancellationToken)
    {
        using var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var status = (int)response.StatusCode;
            var message = status is 401 or 403
                ? "The AI provider rejected the API key."
                : status == 429
                    ? "The AI provider rate limit was reached."
                    : "The AI provider could not complete this request.";
            throw new AiProviderException(message, status is 401 or 403 or 429 ? status : StatusCodes.Status502BadGateway);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var limited = new MemoryStream();
        var buffer = new byte[81920];
        var total = 0;
        int read;
        while ((read = await stream.ReadAsync(buffer, cancellationToken)) > 0)
        {
            total += read;
            if (total > MaxProviderResponseBytes)
                throw new AiProviderException("The AI provider returned too much data.");
            await limited.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
        }

        limited.Position = 0;
        string json;
        try
        {
            using var providerDocument = await JsonDocument.ParseAsync(limited, cancellationToken: cancellationToken);
            json = ExtractContent(provider, providerDocument.RootElement);
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException)
        {
            throw new AiProviderException("The AI provider returned an invalid response.");
        }
        if (string.IsNullOrWhiteSpace(json))
            throw new AiProviderException("The AI provider returned an empty response.");

        try
        {
            var contentNode = JsonNode.Parse(json)
                ?? throw new AiProviderException("The AI provider returned an empty resume.");
            ResumeContentCanonicaliser.Apply(contentNode);
            using var contentDocument = JsonDocument.Parse(contentNode.ToJsonString());
            var validationError = JsonSchemaValidator.Validate(contentDocument.RootElement, schema);
            if (validationError is not null)
                throw new AiProviderException($"The AI response did not match the Resumade schema: {validationError}");

            return JsonSerializer.Deserialize<ResumeContentDto>(contentDocument.RootElement.GetRawText(), JsonOptions)
                ?? throw new AiProviderException("The AI provider returned an empty resume.");
        }
        catch (JsonException)
        {
            throw new AiProviderException("The AI provider returned invalid JSON.");
        }
    }

    private static HttpRequestMessage CreateOpenAiRequest(string apiKey, string model, string system, string user, JsonObject schema)
    {
        var body = new JsonObject
        {
            ["model"] = model,
            ["input"] = Messages(system, user),
            ["max_output_tokens"] = 10000,
            ["text"] = new JsonObject
            {
                ["format"] = new JsonObject
                {
                    ["type"] = "json_schema",
                    ["name"] = "resumade_resume",
                    ["strict"] = true,
                    ["schema"] = schema.DeepClone()
                }
            }
        };
        return JsonRequest(HttpMethod.Post, "https://api.openai.com/v1/responses", body, request =>
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey));
    }

    private static HttpRequestMessage CreateClaudeRequest(string apiKey, string model, string system, string user, JsonObject schema)
    {
        var body = new JsonObject
        {
            ["model"] = model,
            ["max_tokens"] = 10000,
            ["system"] = system,
            ["messages"] = new JsonArray(new JsonObject { ["role"] = "user", ["content"] = user }),
            ["output_config"] = new JsonObject
            {
                ["format"] = new JsonObject
                {
                    ["type"] = "json_schema",
                    ["schema"] = schema.DeepClone()
                }
            }
        };
        return JsonRequest(HttpMethod.Post, "https://api.anthropic.com/v1/messages", body, request =>
        {
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
        });
    }

    private static HttpRequestMessage CreateChatCompletionsRequest(
        string url,
        string apiKey,
        string model,
        string system,
        string user,
        JsonObject schema,
        bool strictSchema)
    {
        JsonNode responseFormat = strictSchema
            ? new JsonObject
            {
                ["type"] = "json_schema",
                ["json_schema"] = new JsonObject
                {
                    ["name"] = "resumade_resume",
                    ["strict"] = true,
                    ["schema"] = schema.DeepClone()
                }
            }
            : new JsonObject { ["type"] = "json_object" };

        var body = new JsonObject
        {
            ["model"] = model,
            ["messages"] = Messages(system, user),
            ["response_format"] = responseFormat,
            ["max_tokens"] = 10000
        };
        return JsonRequest(HttpMethod.Post, url, body, request =>
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey));
    }

    private static HttpRequestMessage CreateGeminiRequest(string apiKey, string model, string system, string user, JsonObject schema)
    {
        var body = new JsonObject
        {
            ["systemInstruction"] = new JsonObject
            {
                ["parts"] = new JsonArray(new JsonObject { ["text"] = system })
            },
            ["contents"] = new JsonArray(new JsonObject
            {
                ["role"] = "user",
                ["parts"] = new JsonArray(new JsonObject { ["text"] = user })
            }),
            ["generationConfig"] = new JsonObject
            {
                ["responseMimeType"] = "application/json",
                ["responseJsonSchema"] = schema.DeepClone(),
                ["maxOutputTokens"] = 10000
            }
        };
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent";
        return JsonRequest(HttpMethod.Post, url, body, request => request.Headers.Add("x-goog-api-key", apiKey));
    }

    private static JsonArray Messages(string system, string user) => new(
        new JsonObject { ["role"] = "system", ["content"] = system },
        new JsonObject { ["role"] = "user", ["content"] = user });

    private static HttpRequestMessage JsonRequest(HttpMethod method, string url, JsonObject body, Action<HttpRequestMessage> configure)
    {
        var request = new HttpRequestMessage(method, url)
        {
            Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        };
        configure(request);
        return request;
    }

    private static string ExtractContent(string provider, JsonElement root)
    {
        if (provider == "openai" && root.TryGetProperty("output", out var output))
        {
            foreach (var item in output.EnumerateArray())
            {
                if (!item.TryGetProperty("content", out var blocks)) continue;
                foreach (var block in blocks.EnumerateArray())
                {
                    if (block.TryGetProperty("text", out var text)) return text.GetString() ?? string.Empty;
                }
            }
        }

        if (provider == "claude" && root.TryGetProperty("content", out var content))
        {
            foreach (var block in content.EnumerateArray())
            {
                if (block.TryGetProperty("text", out var text)) return text.GetString() ?? string.Empty;
            }
        }

        if (provider == "gemini" &&
            root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0 &&
            candidates[0].TryGetProperty("content", out var candidateContent) &&
            candidateContent.TryGetProperty("parts", out var parts) && parts.GetArrayLength() > 0 &&
            parts[0].TryGetProperty("text", out var geminiText))
            return geminiText.GetString() ?? string.Empty;

        if (root.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0 &&
            choices[0].TryGetProperty("message", out var message) &&
            message.TryGetProperty("content", out var messageContent))
            return messageContent.GetString() ?? string.Empty;

        return string.Empty;
    }
}
