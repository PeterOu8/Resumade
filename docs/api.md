# API reference and data model

The ASP.NET Core API lives in `api/`. Local HTTPS examples use `https://localhost:7131`. Request and response JSON uses camel-case property names. The routes below come from the current controllers; the development OpenAPI document is at `/openapi/v1.json`.

## Health and authentication

| Method | Route | Authentication | Success response |
| --- | --- | --- | --- |
| GET | `/api/health` | None | `200` with `status: "healthy"` and `service: "Resumade API"`. |
| POST | `/api/auth/register` | None | `200` with token, user ID, email, and display name. |
| POST | `/api/auth/login` | None | `200` with the same authentication response. |
| GET | `/api/auth/me` | Bearer token | `200` with user ID, email, and display name from the token's claims. |

Registration accepts:

```json
{
  "email": "developer@example.test",
  "password": "example-local-password",
  "displayName": "Example Developer"
}
```

Login accepts `email` and `password` only. Email is required, must be an email address, and has a maximum length of 254 characters. Registration requires a password of 8 to 128 characters and a display name of at most 100 characters. Login requires a password of at most 128 characters.

The service trims and lowercases email addresses, trims display names on registration, and stores hashed passwords. Successful registration and login return:

```json
{
  "token": "<jwt>",
  "userId": "<user-guid>",
  "email": "developer@example.test",
  "displayName": "Example Developer"
}
```

Tokens use HMAC-SHA256 and expire one hour after issuance. Protected requests must include `Authorization: Bearer <jwt>`. Issuer, audience, lifetime, and signing key are validated. There is no refresh-token or logout endpoint.

Registration returns `409` for an already registered email; login returns `401` for invalid credentials. Invalid request DTOs return `400`. Authentication actions declare an `auth` rate-limiting policy attribute, but the application has no registered rate-limiting policy or middleware.

## Saved resumes

All resume endpoints require a bearer token. The authenticated user's ID comes from the token; clients do not supply an owner ID.

| Method | Route | Behavior |
| --- | --- | --- |
| POST | `/api/resumes` | Creates a resume; returns `201`, the saved resume, and a `Location` header for retrieval. |
| GET | `/api/resumes` | Returns the user's resumes, ordered by `updatedAt` descending. |
| GET | `/api/resumes/{id}` | Returns one owned resume or `404`. |
| PUT | `/api/resumes/{id}` | Replaces title and content, updates `updatedAt`, and returns the saved resume or `404`. |
| DELETE | `/api/resumes/{id}` | Permanently removes an owned resume; returns `204` or `404`. |

The `{id}` route parameter must be a GUID. Looking up, replacing, or deleting another user's resume returns `404`, just like a missing record. List queries are also filtered by owner. There is no pagination, version history, or soft deletion.

Create and update use the same request shape. `title` and `content` are required; the title has a maximum length of 200 characters and is trimmed before saving.

```json
{
  "title": "Software developer resume",
  "content": {
    "personalInfo": {
      "fullName": "Example Developer",
      "email": "developer@example.test",
      "phone": "",
      "location": "Sydney",
      "title": "Software Developer",
      "linkedIn": null,
      "gitHub": null,
      "website": null
    },
    "summary": "Developer building web applications.",
    "keySkills": [
      { "category": "Development", "items": ["C#", "TypeScript"] }
    ],
    "experience": [
      {
        "company": "Example Company",
        "title": "Developer",
        "location": "Sydney",
        "startDate": "2025-01",
        "endDate": null,
        "current": true,
        "bullets": ["Built and maintained internal web applications."]
      }
    ],
    "projects": [
      {
        "name": "Resume workspace",
        "description": "A personal resume editing tool.",
        "url": null,
        "gitHub": null,
        "techStack": ["C#", "TypeScript"]
      }
    ],
    "education": [
      {
        "school": "Example University",
        "degree": "Bachelor of Information Technology",
        "major": "Software Development",
        "startDate": "2020-02",
        "endDate": "2023-11",
        "current": false,
        "location": "Sydney",
        "awards": []
      }
    ]
  }
}
```

Resume responses contain `id`, `title`, the structured `content` object, `createdAt`, and `updatedAt`. Creation and update timestamps are generated in UTC. A PUT replaces the complete content object; it does not merge individual sections.

The content fields are defined in `api/Dtos/Resume/ResumeContentDto.cs`. Experience and education dates are strings: the example uses `YYYY-MM`, but the DTOs do not validate a date format or enforce consistency between `current` and `endDate`. There is no deeper field validation on the nested content DTOs.

## Persistence

`ResumadeDbContext` uses EF Core with PostgreSQL. A user has a GUID, unique email, password hash, display name, and UTC creation timestamp. A resume has a GUID, user foreign key, title, serialized `ContentJson`, and UTC creation/update timestamps. The service serializes and deserializes content using web JSON defaults; clients receive a content object rather than the raw JSON string.

The database relationship cascades resume deletion when a user is deleted, though no user-deletion endpoint exists. Migrations are stored in `api/Migrations/` and must be applied explicitly; see [development setup](development.md).
