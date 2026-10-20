# Resumade

AI-assisted career preparation SaaS. The backend is one controller-based ASP.NET Core 10 project with EF Core and PostgreSQL; the existing Next.js app remains the frontend foundation.

The backend lives in `src/Resumade.Api`, with controllers, services, models, and infrastructure in separate folders. All backend tests live in `tests/Resumade.Api.Tests`. See the [backend consolidation report](docs/backend-consolidation.md) for the layout and preserved routes.

From the repository root:

```powershell
dotnet restore Resumade.slnx
dotnet build Resumade.slnx --no-restore
dotnet test Resumade.slnx --no-build
dotnet run --project src/Resumade.Api
```

Configure development secrets using the authentication instructions below before running the API. The existing HTTP and HTTPS launch profiles retain ports 5011 and 7131.

See [authentication setup](docs/authentication.md) for Step 4 local configuration.

Authenticated profile endpoints are available at `GET /api/profile` and `PUT /api/profile`. See the [resource ownership rule](docs/ownership.md) that all user-owned modules follow.

Structured resume metadata is available through `POST /api/resumes`, `GET /api/resumes`, and `GET /api/resumes/{resumeId}`. The [resume domain design](docs/architecture/resume-domain.md) documents versioning, month-precision dates, ownership, and deletion behavior.

Original PDF/DOCX documents can be uploaded with `POST /api/resumes/{resumeId}/document`. See the [file storage design](docs/file-storage.md) for limits, replacement behavior, and configuration.
