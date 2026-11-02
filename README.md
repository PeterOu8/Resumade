# Resumade

Resumade is a resume preparation application in development. Its backend is a controller-based ASP.NET Core 10 API with JWT authentication, EF Core, and PostgreSQL for accounts and saved resumes.

## Backend layout

```text
api/                         ASP.NET Core 10 API
  Controllers/               Health, authentication, and resume endpoints
  Data/                      EF Core database context
  Dtos/                      Request and response contracts
  Models/                    User and resume persistence models
  Migrations/                PostgreSQL schema migrations
  Services/                  Authentication, resume CRUD, and parser helpers
tests/Resumade.Api.Tests/     Parser unit tests and API integration tests
Resumade.Api.slnx             Backend and test solution
```

## Local development

Use the .NET 10 SDK and a local PostgreSQL database for persisted accounts and resumes. Database migration commands also require the EF Core CLI. See [backend development setup](docs/development.md) for configuration and the full startup sequence.

After configuring the API environment variables and applying migrations:

```powershell
# From the repository root
dotnet restore Resumade.Api.slnx
dotnet build Resumade.Api.slnx --no-restore
dotnet run --project api/Resumade.Api.csproj --launch-profile https
```

The API HTTPS profile uses `https://localhost:7131` and `http://localhost:5011`. Development API documentation is served at `/scalar/v1`, with the OpenAPI document at `/openapi/v1.json`.

## Current capabilities and limits

| Area | Current implementation |
| --- | --- |
| Accounts | API registration, login, and current-token claims using JWT bearer authentication. |
| Saved resumes | Authenticated create, list, retrieve, replace, and delete operations scoped to the token's user. |
| Persistence | User records and serialized resume content, with explicit EF Core migrations. |
| Health | Public `/api/health` endpoint reporting process health without querying the database. |
| Resume parsing | Authenticated text-item JSON input grouped into sections and extracted into structured resume content. |
| Automated tests | Section extraction fixtures, parser pipeline checks, parse endpoint validation/authentication, and health. |

The API does not currently expose profile editing, document storage/upload, resume versioning, tailoring, or PDF export endpoints. Parsing accepts frontend-extracted text items rather than uploaded files. `FileStorage:RootPath` is present in configuration but is not used by the running API.

See [development setup and checks](docs/development.md) and the [API reference and data model](docs/api.md).
