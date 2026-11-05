using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace Resumade.Api.Infrastructure.RateLimiting;

internal sealed class ClientIpResolver
{
    private readonly byte[]? _token;

    public ClientIpResolver(string? token)
    {
        if (string.IsNullOrEmpty(token)) return;
        if (token.Length != 64 || !token.All(Uri.IsHexDigit))
            throw new InvalidOperationException("Proxy:WebToken must contain 64 hexadecimal characters.");

        _token = Encoding.ASCII.GetBytes(token);
    }

    public string Resolve(HttpContext context)
    {
        var headers = context.Request.Headers;
        if (_token is not null &&
            headers.TryGetValue("X-Resumade-Proxy-Token", out var tokens) && tokens.Count == 1 &&
            tokens[0] is { Length: 64 } token &&
            CryptographicOperations.FixedTimeEquals(_token, Encoding.UTF8.GetBytes(token)) &&
            headers.TryGetValue("X-Resumade-Client-IP", out var addresses) && addresses.Count == 1 &&
            addresses[0] is { Length: > 0 and <= 45 } address &&
            !address.Any(c => char.IsWhiteSpace(c) || c is '%' or '[' or ']') &&
            IPAddress.TryParse(address, out var ip) &&
            (address.Contains(':') || address == ip.ToString()))
        {
            return Normalise(ip);
        }

        return context.Connection.RemoteIpAddress is { } remote ? Normalise(remote) : "unknown";
    }

    private static string Normalise(IPAddress ip) =>
        (ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip).ToString();
}
