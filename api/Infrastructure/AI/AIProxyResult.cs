namespace Resumade.Api.Infrastructure.AI;

public sealed record AIProxyResult(
    int StatusCode,
    AIProxyResponse? Response = null,
    string? Error = null);