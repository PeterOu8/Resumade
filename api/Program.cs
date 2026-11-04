using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Resumade.Api.Data;
using Resumade.Api.Services.Auth;
using Resumade.Api.Services.AI;
using Resumade.Api.Services.Pdf;
using Resumade.Api.Services.Parsing;
using Resumade.Api.Services.Resume;
using Scalar.AspNetCore;
using System.Globalization;
using System.Net;
using System.Threading.RateLimiting;
using System.Text;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
var knownProxyAddresses = builder.Configuration
    .GetSection("Proxy:KnownProxies")
    .Get<string[]>()
    ?? [];

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    options.KnownProxies.Clear();
    options.KnownIPNetworks.Clear();

    foreach (var address in knownProxyAddresses)
    {
        if (!IPAddress.TryParse(address, out var proxyAddress))
            throw new InvalidOperationException($"Proxy:KnownProxies contains an invalid IP address: '{address}'.");

        options.KnownProxies.Add(proxyAddress);
    }
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = static (context, _) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
        }

        return ValueTask.CompletedTask;
    };

    options.AddPolicy("auth", httpContext => FixedWindowPerIp(httpContext, 5, TimeSpan.FromMinutes(1)));
    options.AddPolicy("pdf", httpContext => FixedWindowPerIp(httpContext, 3, TimeSpan.FromMinutes(1)));
    options.AddPolicy("parse", httpContext => FixedWindowPerIp(httpContext, 20, TimeSpan.FromMinutes(1)));
    options.AddPolicy("ai", httpContext => FixedWindowPerIp(httpContext, 10, TimeSpan.FromMinutes(1)));
});
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? [];

if (allowedOrigins.Length == 0)
    throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one frontend origin.");

foreach (var origin in allowedOrigins)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
        uri.Scheme is not ("http" or "https") ||
        !string.IsNullOrEmpty(uri.PathAndQuery) && uri.PathAndQuery != "/" ||
        !string.IsNullOrEmpty(uri.Fragment) ||
        !string.IsNullOrEmpty(uri.UserInfo))
    {
        throw new InvalidOperationException(
            $"Cors:AllowedOrigins contains an invalid origin: '{origin}'.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token in the format: Bearer {your token}"
        };

        return Task.CompletedTask;
    });
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ResumeService>();
builder.Services.AddScoped<ResumeParserService>();
builder.Services.AddSingleton<ResumeGenerationService>();
builder.Services.AddScoped<AiResumeService>();
builder.Services.AddHttpClient<AiProviderService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(90);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Resumade/1.0");
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("Jwt:Key is missing in configuration.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var connectionString =
    builder.Configuration.GetConnectionString("ResumadeDatabase")
    ?? throw new InvalidOperationException(
        "Database connection string is not configured.");

builder.Services.AddDbContext<ResumadeDbContext>(options =>
    options.UseNpgsql(connectionString));

var app = builder.Build();

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.MapControllers();

app.Run();

static RateLimitPartition<string> FixedWindowPerIp(
    HttpContext context,
    int permitLimit,
    TimeSpan window)
{
    // Forwarded headers replace this value only when the immediate proxy is trusted.
    var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = permitLimit,
        Window = window,
        QueueLimit = 0,
        AutoReplenishment = true
    });
}

public partial class Program;
