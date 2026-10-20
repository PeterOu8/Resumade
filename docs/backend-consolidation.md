# Backend consolidation

The local Resumade backend has been consolidated from four projects into one ASP.NET Core 10 application. SmartCV was not imported. Existing authentication, PostgreSQL persistence, profiles, resumes, and source-document uploads remain implemented.

## Layout

```text
Resumade.slnx
src/Resumade.Api/
  Controllers/
    AuthController.cs
    HealthController.cs
    ProfileController.cs
    ResumeDocumentsController.cs
    ResumesController.cs
  Services/
    AuthService.cs
    ProfileService.cs
    ResumeDocumentService.cs
    ResumeService.cs
    Interfaces/
      IAccessTokenFactory.cs
      ICurrentUser.cs
      IFileStorage.cs
      IPasswordService.cs
      IProfileRepository.cs
      IResumeDocumentRepository.cs
      IResumeRepository.cs
      IUserRepository.cs
  Models/
    [HTTP request and response records, one type per file]
    Entities/{Common,Identity,Profiles,Resumes}/
    Files/
    Identity/
    Profiles/
    Resumes/
  Infrastructure/
    Authentication/
    FileStorage/
    Persistence/
      Configurations/
      Migrations/
  Properties/launchSettings.json
  Program.cs
  appsettings.json
  appsettings.Development.json
  Resumade.Api.csproj
  Resumade.Api.csproj.user
  Resumade.Api.http
tests/Resumade.Api.Tests/
  AuthenticationAndProfileTests.cs
  AuthServiceTests.cs
  ControllerArchitectureTests.cs
  ResumadeApiFactory.cs
  ResumeDocumentTests.cs
  ResumeDomainTests.cs
  ResumeTests.cs
  Resumade.Api.Tests.csproj
```

## Migration map

| Previous location | New location |
| --- | --- |
| `apps/api/Resumade.Api/Controllers` | `src/Resumade.Api/Controllers` |
| `apps/api/Resumade.Api/Contracts` | `src/Resumade.Api/Models`, split into named record files |
| `apps/api/Resumade.Api/Authentication` | `src/Resumade.Api/Infrastructure/Authentication` |
| `apps/api/Resumade.Application/*/*Service.cs` | `src/Resumade.Api/Services` |
| Application command/result/storage records | `src/Resumade.Api/Models/{Identity,Profiles,Resumes,Files}` |
| Existing Application interfaces, including those embedded in contracts | `src/Resumade.Api/Services/Interfaces` |
| `apps/api/Resumade.Domain` entities and value types | `src/Resumade.Api/Models/Entities` |
| `apps/api/Resumade.Infrastructure` implementations | `src/Resumade.Api/Infrastructure` |
| `apps/api/Resumade.slnx` | Root `Resumade.slnx`, containing the API and test project |
| Unit and integration test projects | `tests/Resumade.Api.Tests` |

All runtime code uses namespaces rooted at `Resumade.Api`; tests use `Resumade.Api.Tests`. The three unused `Class1` scaffolds and redundant project files were removed. Configuration, launch profiles, HTTP examples, IDE project settings, user-secrets IDs, database migrations, and meaningful tests were retained. The local exclusions for unfinished modules from the modified Application and Infrastructure project files were translated into the consolidated project. Other pre-existing uncommitted files were left unchanged.

The existing interfaces were retained to preserve repository, identity, and storage dependencies and existing test doubles. No new service interfaces or product abstractions were introduced. All four application service implementations, password hashing, token generation, repository behavior, and local file storage behavior remain intact.

Package versions were not upgraded. Framework-provided configuration and identity package references became redundant in the Web SDK project. The old direct JWT package reference was removed because JwtBearer already resolves its required version. Comparing old and new API assets confirmed identical resolved NuGet package names and versions.

EF migration IDs, operations, tables, and constraints are unchanged. Entity identifiers in generated migration metadata and the snapshot follow the relocated namespaces. The test suite verifies that the snapshot matches the runtime model and that all five migrations remain discoverable. The design-time factory now reads configuration from the output directory, avoiding dependence on the former sibling-project layout.

## Preserved HTTP routes

| Controller | Method | Route |
| --- | --- | --- |
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Auth | GET | `/api/auth/me` |
| Health | GET | `/api/health` |
| Profile | GET, PUT | `/api/profile` |
| Resumes | GET, POST | `/api/resumes` |
| Resumes | GET | `/api/resumes/{resumeId:guid}` |
| ResumeDocuments | POST | `/api/resumes/{resumeId:guid}/document` |

These routes already used controllers before consolidation; no Minimal API endpoints needed conversion. Health now uses an explicit route instead of a controller-name token and returns the same JSON fields and values. MVC registration, development OpenAPI/Scalar endpoints, HTTPS redirection, authentication/authorization ordering, JWT validation, service lifetimes, upload metadata, cancellation, validation, ownership enforcement, and file cleanup were preserved.

The upload route retains its multipart `file` field, 10 MB request/file limits, PDF/DOCX extension and MIME validation, and security boundaries. It stores original documents; it does not render or parse PDFs.

## Verification and limitations

The baseline suite passed 8 unit and 8 integration tests. After consolidation, all 16 existing tests passed. Four additional integration checks verify health JSON, the complete set of 10 unique controller routes, dependency resolution for all five controllers, and migration/snapshot compatibility. Final verification passed all 20 tests with no failures or skips. Restore, solution build, Release publish, and `git diff --check` succeeded. The Release artifact is `src/Resumade.Api/bin/Release/net10.0/publish/Resumade.Api.dll`.

Run from the repository root:

```powershell
dotnet restore Resumade.slnx
dotnet build Resumade.slnx --no-restore
dotnet test Resumade.slnx --no-build
dotnet publish src/Resumade.Api/Resumade.Api.csproj --configuration Release
```

Integration tests use the existing PostgreSQL configuration and apply migrations, as before. Development secrets retain their original ID; the database and signing key do not need to be recreated. See `authentication.md` for configuration and the updated single-project EF command.

No AI proxy, PDF renderer/parser, rate limiter, security-header middleware, CORS setup, or frontend static hosting existed in the local backend. No placeholders or substitute implementations were added. Frontend files, API URLs, and launch ports were left unchanged. Existing Next.js calls to `/api/parse` and `/api/tailor` remain handled by Next.js; browser-level frontend verification was not performed.

There was no tracked Dockerfile, base Compose file, CI workflow, or deployment script to update. The existing untracked Compose override was preserved. Docker verification is unavailable because the Docker daemon is not running in this environment. NuGet restore reports NU1900 when it cannot reach the vulnerability-data feed; restore and compilation otherwise succeed.

The pre-existing untracked project audit is a historical document and retains its original paths. Ignored build outputs under the former backend/test directories may remain locally; they are not referenced by the new solution.
