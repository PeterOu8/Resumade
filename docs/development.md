# Backend development setup

Run commands from the repository root unless a section changes directory. These instructions describe the checked-in implementation and its existing dependencies.

## Prerequisites

- .NET 10 SDK for the API and test project.
- PostgreSQL and an existing local database for accounts and saved resumes.
- EF Core CLI compatible with the API's EF Core 10 packages to apply migrations.

## API configuration

`api/Program.cs` reads these settings:

| Setting | Environment variable | Purpose |
| --- | --- | --- |
| `ConnectionStrings:ResumadeDatabase` | `ConnectionStrings__ResumadeDatabase` | PostgreSQL connection string. |
| `Jwt:Key` | `Jwt__Key` | Signing key for HMAC-SHA256 bearer tokens; use at least 32 random ASCII characters. |
| `Jwt:Issuer` | `Jwt__Issuer` | Token issuer; checked-in default is `Resumade`. |
| `Jwt:Audience` | `Jwt__Audience` | Token audience; checked-in default is `ResumadeUsers`. |

For a local PowerShell session, replace the example values:

```powershell
$env:ConnectionStrings__ResumadeDatabase = 'Host=localhost;Port=5432;Database=resumade;Username=<local-user>;Password=<local-password>'
$env:Jwt__Key = '<replace-with-a-random-local-signing-key-of-at-least-32-characters>'
$env:Jwt__Issuer = 'Resumade'
$env:Jwt__Audience = 'ResumadeUsers'
```

The API project also has a `UserSecretsId` for development configuration. Keep local credentials out of committed configuration. The examples above set values only for the current terminal and processes launched from it.

`Jwt:Key` must be configured for startup. `Program.cs` rejects a null database connection string; supply a usable connection string before invoking database-backed endpoints. The health endpoint does not query PostgreSQL.

## Build and start the API

```powershell
dotnet restore Resumade.Api.slnx
dotnet build Resumade.Api.slnx --no-restore
dotnet ef database update --project api/Resumade.Api.csproj
dotnet run --project api/Resumade.Api.csproj --launch-profile https
```

Apply migrations against the intended local development database. The API does not automatically apply them on startup. The `SimplifyResume` migration drops the former `IsPrimary`, `Style`, and `ThemeColor` columns.

| Launch profile | Listening addresses |
| --- | --- |
| `http` | `http://localhost:5011` |
| `https` | `https://localhost:7131` and `http://localhost:5011` |

Both profiles set the environment to `Development`. The pipeline includes HTTPS redirection. If your machine has not trusted the local development certificate, run `dotnet dev-certs https --trust` before accessing HTTPS.

With the HTTPS profile running:

```powershell
Invoke-RestMethod https://localhost:7131/api/health
```

The response is `{"status":"healthy","service":"Resumade API"}`. This is a process health response, not a database readiness check. Development-only API documentation is available at `https://localhost:7131/scalar/v1` and `https://localhost:7131/openapi/v1.json`.

The API's `Frontend` CORS policy allows `http://localhost:3000`, any header, and any method. Other client origins require a code change to that policy.

## Checks

From the root, with the API configuration above set:

```powershell
dotnet test Resumade.Api.slnx --no-build --no-restore
```

Build first when source changes. The only current test is `HealthControllerTests.GetHealth_ReturnsExpectedResponse`, which checks the status, content type, and two response fields. It starts the application and requires startup configuration, but does not access the database.

## Known implementation gaps

- Authentication actions have an `EnableRateLimiting("auth")` attribute, but `Program.cs` does not register a rate-limiting policy or middleware. Rate limiting is not configured.
- Parser helpers and AI DTOs exist, but the API exposes no parsing or tailoring routes and does not register a parser service.
- `FileStorage:RootPath` is present in configuration but is unused. There is no document upload or storage endpoint.
- Only the health endpoint has an automated test; account and resume operations have no tests in the current project.
