# API reference and data model

The ASP.NET Core API lives in `api/`. Local HTTPS examples use `https://localhost:7131`. Request and response JSON uses camel-case property names. The routes below come from the current controllers; the development OpenAPI document is at `/openapi/v1.json`.

## Health and authentication

| Method | Route                | Authentication | Success response                                                     |
| ------ | -------------------- | -------------- | -------------------------------------------------------------------- |
| GET    | `/api/health`        | None           | `200` with `status: "healthy"` and `service: "Resumade API"`.        |
| POST   | `/api/auth/register` | None           | `200` with an access token and user details.                         |
| POST   | `/api/auth/signin`   | None           | `200` with the same authentication response.                         |
| POST   | `/api/auth/google`   | Google ID token | `200` with the same authentication response. Accepts `{ "idToken": "…" }`. |
| GET    | `/api/auth/me`       | Bearer token   | `200` with user ID, email, and display name from the token's claims. |

Registration accepts:

```json
{
  "email": "developer@example.test",
  "password": "example-local-password",
  "displayName": "Example Developer"
}
```

Sign-in accepts `email` and `password`. Email is required and has a maximum length of 254 characters. Registration requires a password of 8 to 128 characters and a display name of at most 100 characters. Sign-in requires a password of at most 128 characters.

The service trims and lowercases email addresses, trims display names on registration, and stores hashed passwords. Successful registration and login return:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "userId": "<user-guid>",
    "email": "developer@example.test",
    "displayName": "Example Developer"
  }
}
```

Tokens use HMAC-SHA256 and expire one hour after issuance. Protected requests must include `Authorization: Bearer <jwt>`. Issuer, audience, lifetime, and signing key are validated. There is no refresh-token or logout endpoint.

Registration returns `409` for an already registered email. Sign-in returns `401` for invalid credentials or a rejected Google ID token. Invalid request DTOs return `400`. The web app manages sign-out through Auth.js.

After five incorrect password attempts, password sign-in is locked for that account for 15 minutes. Locked accounts receive the same `401` response as other invalid sign-in attempts.

## Request limits

The API applies one-minute limits per client IP. The auth routes share a limit of 5 requests, PDF export allows 3, PDF parsing allows 20, and the AI routes share a limit of 10. Requests over a limit receive `429` and a `Retry-After` header. Behind a reverse proxy, configure the immediate proxy as trusted so the limiter can use the forwarded client IP. See [local API configuration](development.md#start-the-api).

## Saved resumes

Saved-resume operations require a bearer token. The authenticated user's ID comes from the token. PDF export is available to guests.

| Method | Route               | Behavior                                                                                  |
| ------ | ------------------- | ----------------------------------------------------------------------------------------- |
| POST   | `/api/resumes`      | Creates a resume; returns `201`, the saved resume, and a `Location` header for retrieval. |
| GET    | `/api/resumes`      | Returns the user's resumes, ordered by `updatedAt` descending.                            |
| GET    | `/api/resumes/{id}` | Returns one owned resume or `404`.                                                        |
| PUT    | `/api/resumes/{id}` | Replaces title and content, updates `updatedAt`, and returns the saved resume or `404`.   |
| DELETE | `/api/resumes/{id}` | Permanently removes an owned resume; returns `204` or `404`.                              |

The `{id}` route parameter must be a GUID. Looking up, replacing, or deleting another user's resume returns `404`, just like a missing record. List queries are also filtered by owner. There is no pagination, version history, or soft deletion.

Create and update use the same request shape. `title` and `content` are required; the title has a maximum length of 200 characters and is trimmed before saving.

```json
{
  "title": "Software developer resume",
  "content": {
    "profile": {
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
    "keySkills": [{ "category": "Development", "items": ["C#", "TypeScript"] }],
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

The content fields are defined in `api/Dtos/Resumes/ResumeContentDto.cs`. Experience and education dates are strings: the example uses `YYYY-MM`, but the DTOs do not validate a date format or enforce consistency between `current` and `endDate`. There is no deeper field validation on the nested content DTOs.

## PDF export

`POST /api/resumes/pdf` accepts a JSON object with `title` and self-contained preview `html`. Guests and signed-in users can export the current draft. Chromium uses the preview's print styles, paper size, margins, and embedded web fonts. The response is an `application/pdf` attachment with selectable text and `Cache-Control: no-store`.

The API accepts titles up to 200 characters and HTML up to 1,000,000 characters, with a 2,000,000-byte request limit. Use inline styles and embedded fonts. The renderer disables scripts and blocks external resource requests. See [local development](development.md#start-the-api) for browser configuration.

## Resume content extraction

`POST /api/resumes/parse` is available to guests and accepts an array of text items extracted by PDF.js:

```json
[
  {
    "text": "Jane Smith",
    "x": 40,
    "y": 40,
    "width": 100,
    "height": 16,
    "fontName": "Arial-Bold",
    "hasEOL": true
  },
  {
    "text": "Technical Skills",
    "x": 40,
    "y": 70,
    "width": 110,
    "height": 12,
    "fontName": "Arial-Bold",
    "hasEOL": true
  },
  {
    "text": "Languages: C#, SQL",
    "x": 40,
    "y": 90,
    "width": 130,
    "height": 12,
    "fontName": "Arial",
    "hasEOL": true
  }
]
```

Items must be in reading order. `hasEOL` marks the end of a line; the final line is also retained without this marker. The backend sanitizes and maps the items, groups lines and sections, then returns `200` with a `ResumeContentDto` (`profile`, `summary`, `keySkills`, `experience`, `projects`, `education`, `additionalSections`). Parsing does not save a resume or access the database.

Requests return `400` for a null or empty array, null entries, missing required values, nonfinite coordinates/dimensions, negative dimensions, or configured size limits: 50,000 items, 10,000 characters per text value, and 256 characters per font name. `fontName` is optional. Missing content fields return empty strings/lists or nullable links/end dates.

Extraction uses heading aliases (for example, “Employment History” and “Academic Background”), explicit contact/date/link patterns, and entry boundaries from dates, bullets, formatting, and blank lines. Repeated sections retain document order; matching skill categories merge case-insensitively.

Unfamiliar sections are returned in `additionalSections`, including recognized unsupported headings such as certifications and references. Each item has a `title` retaining the original heading, summary-style regular text in `content`, and a `bullets` list extracted like experience descriptions. For example:

```json
{
  "additionalSections": [
    {
      "title": "INTERNATIONAL BUSINESS EXPOSURE",
      "content": "Industry Exposure",
      "bullets": ["Visited local businesses.", "Discussed business operations."]
    }
  ]
}
```

Regular text lines join with spaces, and blank lines separate paragraphs with `\n\n`, matching summary extraction. Bullet markers are removed; subsequent unmarked lines join the preceding bullet until a blank line or a new bullet. A blank line ends the bullet run, allowing following regular text to return to `content`. Each content line goes to either `content` or `bullets`. Sections containing only regular text return an empty bullet list; sections containing only bullets return empty content.

Additional sections remain separate, including repeated headings, and retain their order within the collection. Existing saved content without this field defaults to an empty collection; additional sections without `bullets` default to an empty list. Existing stored content strings are not re-parsed automatically. No database migration is required. The DTO does not represent the complete ordering of additional sections relative to structured categories, or interleaving of regular text and bullets within a section.

For unfamiliar headings, grouping compares font and size with recognized section headings, then considers capitalization, body-text size, and separation from the preceding line. Without recognized section styles, it uses a conservative bold, uppercase heading fallback with increased size or separation. Smaller entry titles, job titles, bullets, and the first content line are excluded from this fallback detection. Ambiguous headings without sufficient formatting may remain in the preceding section. This is plain-text preservation, not extraction into employment or project fields.

English month names and common numeric month/year formats normalize to `YYYY-MM`; year-only dates retain `YYYY`. Existing Spanish month spellings are also supported. An explicit “Present”, “Current”, or “Now” range sets `current: true` and `endDate: null`. A lone experience date becomes `startDate`; a lone education date becomes the graduation `endDate`. Missing dates do not imply current employment or study.

Descriptions and skill spelling are preserved. Projects only include technologies explicitly listed under labels such as `Tech stack:` or `Technologies:`. Education majors come from explicit major labels or a degree's “in” phrase. The parser does not infer missing employers, technologies, or qualifications. This is a best-effort parser for common layouts, not a trained entity-recognition model; ambiguous header ordering or entries without structural boundaries can need manual correction.

## AI parsing and tailoring

The AI endpoints accept bring-your-own provider credentials and are available to guest and signed-in editor sessions. Resumade supports `openai`, `claude`, `grok`, `gemini`, and `deepseek`. Provider keys are used only for the current upstream request; the API does not persist them or include them in resume data.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/ai/resumes/parse` | Extract plain resume text into Resumade content. |
| POST | `/api/ai/resumes/tailor` | Tailor existing Resumade content to a job description. |

Both requests include an `ai` object:

```json
{
  "provider": "openai",
  "apiKey": "<provider-api-key>",
  "model": "gpt-6-astra"
}
```

`model` may be omitted to use Resumade's provider default. Parsing also accepts `text` (20 to 100,000 characters). Tailoring accepts `resume`, `jobDescription` (20 to 20,000 characters), and optional `instructions` (up to 2,000 characters). A successful response is `{ "content": <ResumeContentDto> }`.

Resumade sends a strict JSON schema to providers that support schema-constrained output. All provider responses—including JSON-mode providers—are then independently validated on the backend. Every required field, nested type, nullable field, and array item must match `ResumeContentDto`; unknown properties, oversized values, and malformed JSON are rejected before content reaches the editor. Tailoring prompts prohibit invented facts and preserve identity, contact, dates, institutions, employers, and entry structure. The web editor computes a field-level comparison and applies only the changes selected by the user.

Invalid keys return `401` or `403`, provider throttling returns `429`, invalid requests return `400`, and upstream or schema failures return `502`. The web proxy uses a 95-second timeout for AI requests.

## Persistence

`ResumadeDbContext` uses EF Core with PostgreSQL. A user has a GUID, unique email, password hash, display name, and UTC creation timestamp. A resume has a GUID, user foreign key, title, serialized `ContentJson`, and UTC creation/update timestamps. The service serializes and deserializes content using web JSON defaults; clients receive a content object rather than the raw JSON string.

The database relationship cascades resume deletion when a user is deleted, though no user-deletion endpoint exists. Migrations are stored in `api/Migrations/` and must be applied explicitly; see [development setup](development.md).
