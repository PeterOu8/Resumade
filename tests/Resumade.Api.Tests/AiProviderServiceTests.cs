using System.Net;
using System.Text;
using System.Text.Json;
using Resumade.Api.Dtos.AI;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Services.AI;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class AiProviderServiceTests
{
    [Theory]
    [InlineData("openai", "https://api.openai.com/v1/responses", "json_schema")]
    [InlineData("claude", "https://api.anthropic.com/v1/messages", "output_config")]
    [InlineData("grok", "https://api.x.ai/v1/chat/completions", "json_schema")]
    [InlineData("gemini", "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent", "responseJsonSchema")]
    [InlineData("deepseek", "https://api.deepseek.com/chat/completions", "json_object")]
    public async Task CompleteAsync_UsesProviderEndpointAndReturnsValidatedContent(
        string provider,
        string expectedUrl,
        string expectedSchemaMarker)
    {
        var handler = new ProviderHandler(provider);
        var service = new AiProviderService(new HttpClient(handler));

        var content = await service.CompleteAsync(
            new AiConnectionDto
            {
                Provider = provider,
                ApiKey = "test-api-key",
                Model = "test-model"
            },
            "System prompt",
            "User prompt",
            CancellationToken.None);

        Assert.Equal(expectedUrl, handler.RequestUri?.ToString());
        Assert.Contains(expectedSchemaMarker, handler.RequestBody);
        Assert.Equal("Test Candidate", content.Profile.FullName);

        if (provider == "claude") Assert.Equal("test-api-key", handler.ApiKeyHeader);
        else if (provider == "gemini") Assert.Equal("test-api-key", handler.GoogleApiKeyHeader);
        else Assert.Equal("test-api-key", handler.BearerToken);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task CompleteAsync_HandlesCancellationAfterHeaders(bool cancelCaller)
    {
        using var body = new StalledBody();
        using var client = new HttpClient(new StalledProviderHandler(body))
        {
            Timeout = cancelCaller ? Timeout.InfiniteTimeSpan : TimeSpan.FromSeconds(1)
        };
        using var caller = new CancellationTokenSource();
        var service = new AiProviderService(client);

        var completion = service.CompleteAsync(
            new AiConnectionDto { Provider = "openai", ApiKey = "test-api-key" },
            "System prompt", "User prompt", caller.Token);

        var testTimeout = TimeSpan.FromSeconds(5);
        await body.ReadStarted.Task.WaitAsync(testTimeout);
        if (cancelCaller)
        {
            await caller.CancelAsync();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => completion.WaitAsync(testTimeout));
        }
        else
        {
            var error = await Assert.ThrowsAsync<AiProviderException>(() => completion.WaitAsync(testTimeout));
            Assert.Equal(504, error.StatusCode);
        }
    }

    private sealed class StalledProviderHandler(StalledBody body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StreamContent(body) });
    }

    private sealed class StalledBody : MemoryStream
    {
        public TaskCompletionSource ReadStarted { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            ReadStarted.TrySetResult();
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            return 0;
        }
    }

    private sealed class ProviderHandler(string provider) : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }
        public string RequestBody { get; private set; } = string.Empty;
        public string? BearerToken { get; private set; }
        public string? ApiKeyHeader { get; private set; }
        public string? GoogleApiKeyHeader { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            BearerToken = request.Headers.Authorization?.Parameter;
            ApiKeyHeader = request.Headers.TryGetValues("x-api-key", out var apiKeys) ? apiKeys.Single() : null;
            GoogleApiKeyHeader = request.Headers.TryGetValues("x-goog-api-key", out var googleKeys) ? googleKeys.Single() : null;

            var resumeJson = JsonSerializer.Serialize(
                new ResumeContentDto
                {
                    Profile = new ProfileDto { FullName = "Test Candidate" }
                },
                new JsonSerializerOptions(JsonSerializerDefaults.Web));

            object envelope = provider switch
            {
                "openai" => new { output = new[] { new { content = new[] { new { type = "output_text", text = resumeJson } } } } },
                "claude" => new { content = new[] { new { type = "text", text = resumeJson } } },
                "gemini" => new { candidates = new[] { new { content = new { parts = new[] { new { text = resumeJson } } } } } },
                _ => new { choices = new[] { new { message = new { content = resumeJson } } } }
            };

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(envelope), Encoding.UTF8, "application/json")
            };
        }
    }
}
