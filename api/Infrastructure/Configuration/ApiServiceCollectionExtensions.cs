using System.Globalization;
using System.Net;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Resend;
using Resumade.Api.Data;
using Resumade.Api.Infrastructure.RateLimiting;
using Resumade.Api.Services.AI;
using Resumade.Api.Services.Auth;
using Resumade.Api.Services.Parsing;
using Resumade.Api.Services.Resume;
using Scalar.AspNetCore;

namespace Resumade.Api.Infrastructure.Configuration;

internal static class ApiServiceCollectionExtensions
{
    public static IServiceCollection AddResumadeApi(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddProxyAndRateLimiting(configuration);
        services.AddFrontendCors(configuration);
        services.AddApiDocumentation();
        services.AddApplicationServices(configuration);
        services.AddJwtAuthentication(configuration);
        services.AddDatabase(configuration);
        services.AddAuthorization();
        return services;
    }

    public static WebApplication UseResumadeApi(this WebApplication app)
    {
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
        return app;
    }

    private static void AddProxyAndRateLimiting(
        this IServiceCollection services, IConfiguration configuration)
    {
        var knownProxyAddresses = configuration
            .GetSection("Proxy:KnownProxies")
            .Get<string[]>() ?? [];

        services.Configure<ForwardedHeadersOptions>(options =>
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
                    throw new InvalidOperationException(
                        $"Proxy:KnownProxies contains an invalid IP address: '{address}'.");

                options.KnownProxies.Add(proxyAddress);
            }
        });

        var clientIpResolver = new ClientIpResolver(configuration["Proxy:WebToken"]);
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = static (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(
                            CultureInfo.InvariantCulture);
                }

                return ValueTask.CompletedTask;
            };

            options.AddPolicy("auth", context =>
                FixedWindow(clientIpResolver.Resolve(context), 5));
            options.AddPolicy("parse", context =>
                FixedWindow(clientIpResolver.Resolve(context), 20));
            options.AddPolicy("ai", context =>
                FixedWindow(clientIpResolver.Resolve(context), 10));
        });
    }

    private static void AddFrontendCors(
        this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];

        if (allowedOrigins.Length == 0)
            throw new InvalidOperationException(
                "Cors:AllowedOrigins must contain at least one frontend origin.");

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

        services.AddCors(options => options.AddPolicy("Frontend", policy =>
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));
    }

    private static void AddApiDocumentation(this IServiceCollection services)
    {
        services.AddOpenApi(options => options.AddDocumentTransformer(
            (document, _, _) =>
            {
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??=
                    new Dictionary<string, IOpenApiSecurityScheme>();
                document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter your JWT token in the format: Bearer {your token}"
                };
                return Task.CompletedTask;
            }));
    }

    private static void AddApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<AuthService>();
        services.AddScoped<IAccountEmailSender, AccountEmailSender>();
        services.AddHttpClient<ResendClient>(client =>
            client.Timeout = TimeSpan.FromSeconds(5));
        services.Configure<ResendClientOptions>(options =>
        {
            options.ThrowExceptions = true;
            options.ApiToken = configuration["Resend:ApiKey"] ?? string.Empty;
        });
        services.AddTransient<IResend, ResendClient>();
        services.AddScoped<ResumeService>();
        services.AddScoped<ResumeParserService>();
        services.AddScoped<AiResumeService>();
        services.AddHttpClient<AiProviderService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(90);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Resumade/1.0");
        });
    }

    private static void AddJwtAuthentication(
        this IServiceCollection services, IConfiguration configuration)
    {
        var jwtKey = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key is missing in configuration.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ClockSkew = TimeSpan.Zero,
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey =
                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
                options.IncludeErrorDetails = false;
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = ValidateAccountState
                };
            });
    }

    private static async Task ValidateAccountState(TokenValidatedContext context)
    {
        var principal = context.Principal!;
        if (!Guid.TryParse(
                principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ||
            !int.TryParse(
                principal.FindFirstValue("sv"),
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out var version))
        {
            context.Fail("Invalid account state.");
            return;
        }

        var database =
            context.HttpContext.RequestServices.GetRequiredService<ResumadeDbContext>();
        if (!await database.Users.AnyAsync(user =>
                user.Id == userId &&
                user.EmailVerifiedAtUtc != null &&
                user.SecurityVersion == version,
            context.HttpContext.RequestAborted))
        {
            context.Fail("Invalid account state.");
        }
    }

    private static void AddDatabase(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("ResumadeDatabase")
            ?? throw new InvalidOperationException(
                "Database connection string is not configured.");
        services.AddDbContext<ResumadeDbContext>(
            options => options.UseNpgsql(connectionString));
    }

    private static RateLimitPartition<string> FixedWindow(
        string partitionKey, int permitLimit)
    {
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            });
    }
}
