namespace Resumade.Api.Models;

public sealed record AIProxyResult(
    int StatusCode,
    AIProxyResponse? Response = null,
    string? Error = null);