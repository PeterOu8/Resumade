# Resumade

AI-assisted career preparation SaaS. The backend is a layered modular monolith built with ASP.NET Core, EF Core and PostgreSQL; the existing Next.js app remains the frontend foundation.

See [authentication setup](docs/authentication.md) for Step 4 local configuration.

Authenticated profile endpoints are available at `GET /api/profile` and `PUT /api/profile`. See the [resource ownership rule](docs/ownership.md) that all user-owned modules follow.

Structured resume metadata is available through `POST /api/resumes`, `GET /api/resumes`, and `GET /api/resumes/{resumeId}`. The [resume domain design](docs/architecture/resume-domain.md) documents versioning, month-precision dates, ownership, and deletion behavior.

Original PDF/DOCX documents can be uploaded with `POST /api/resumes/{resumeId}/document`. See the [file storage design](docs/file-storage.md) for limits, replacement behavior, and configuration.
