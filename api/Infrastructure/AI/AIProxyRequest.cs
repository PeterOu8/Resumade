namespace Resumade.Api.Infrastructure.AI;

public sealed record AIProxyRequest(
    string Provider,
    string ApiKey,
    string Model,
    List<AIMessage> Messages,
    double Temperature = 0.7,
    string? ResponseLanguage = null,
    int? MaxTokens = null);