namespace Resumade.Api.Infrastructure.AI;

public sealed record AIProxyResponse(
    string Content,
    string Provider,
    string Model);