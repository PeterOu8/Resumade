namespace Resumade.Api.Models;

public sealed record AIProxyResponse(
    string Content,
    string Provider,
    string Model);