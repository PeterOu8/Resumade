# Architecture

## System context

Resumade is a three-tier application. A Next.js web app presents the editor and owns the browser session, an ASP.NET Core API owns business rules and persistence, and PostgreSQL stores accounts and saved resumes.

```mermaid
flowchart TB
    User[User browser]
    subgraph Edge[Public edge]
        Web[Next.js / Auth.js]
        Api[ASP.NET Core API]
    end
    subgraph Private[Private data network]
        Database[(PostgreSQL)]
    end
    Providers[AI providers]
    Resend[Resend email]

    User -->|HTTPS pages and route handlers| Web
    User -->|HTTPS API where required| Api
    Web -->|JWT-authenticated JSON| Api
    Api -->|EF Core / Npgsql| Database
    Api -->|user-supplied provider key| Providers
    Api -->|server credential| Resend
    User -. PDF.js import and React PDF export .-> User
```

## Responsibilities

### Web app (`web/`)

- Renders the landing, account, dashboard, and editor experiences.
- Uses Auth.js for credential and Google sign-in sessions.
- Validates external API responses again with Zod before using them.
- Extracts source PDF text and generates downloadable PDFs in the browser.
- Forwards authenticated resume operations to the API without exposing the API JWT to browser JavaScript.

### API (`api/`)

- Validates registration, authentication, resume, parsing, and AI requests.
- Enforces resume ownership, the 16-resume cap, and per-client rate limits.
- Serialises the structured resume document into PostgreSQL.
- Validates AI provider responses against the application schema.
- Sends account-action email without returning provider details to clients.

Composition is centralised in `Infrastructure/Configuration/ApiServiceCollectionExtensions.cs`; `Program.cs` is intentionally limited to host creation and pipeline startup. Feature services remain grouped under `Services/Auth`, `Services/Resume`, `Services/Parsing`, and `Services/AI`.

### Resume documents and local recovery

`web/src/features/resume-document` owns the document and presentation schemas, browser draft storage, and the guest-draft index. Editor components remain in `components/editor`, server-side resume access in `lib/resume`, and PDF generation in `lib/pdf`. Shared presentation types are derived from the document schema.

A saved resume contains its structured content and a versioned presentation containing the template, section order, paper size, margins, colours, and custom typography. The HTML preview and PDF export consume the same document settings. Older resumes without presentation data use the default settings.

Guest drafts are scoped to the editor workspace. After sign-in, the matching guest draft moves into the account's workspace and continues automatically. A pending Save action resumes after sign-in. An empty document title becomes the profile name followed by “'s resume”, or “Untitled resume”.

When a saved resume differs from the device draft, a branded recovery dialog offers the local or account version. Equal versions open immediately. Opening the account version keeps the local snapshot recoverable for 24 hours. New local snapshots record UTC timestamps, displayed in Australian date format. Browser storage holds personal resume content, so it is a device recovery mechanism rather than a synchronisation service.

The global header is rendered by the root layout on every page. Editor styles are scoped to editor elements. Next.js retains recently visited routes in hidden Activity trees, so global selectors must not infer the active route from the presence of editor DOM.

### Naming and language

Handwritten copy, comments, documentation, and internal names use Australian English. Existing PascalCase C# files and kebab-case web feature files retain their conventions. Framework members, CSS properties, provider fields, public JSON keys, database identifiers, and migration names retain their required spelling for compatibility.

### Database (`api/Data`, `api/Migrations`)

PostgreSQL is authoritative for users, verification/reset tokens, and saved resumes. EF Core migrations are explicit deployment artefacts. The application does not mutate schema during ordinary API startup.

## Trust boundaries

```mermaid
sequenceDiagram
    participant B as Browser
    participant W as Next.js
    participant A as API
    participant D as PostgreSQL

    B->>W: Auth.js session cookie
    W->>A: Bearer API token + validated JSON
    A->>D: Owner-scoped query
    D-->>A: Stored resume page
    A-->>W: DTO page + opaque cursor
    W-->>B: Validated dashboard model
```

- Browser input is untrusted at both the web and API boundaries.
- The web server holds Auth.js secrets and API tokens; client components must not receive them.
- A forwarded IP is trusted only from an explicitly configured proxy or from the authenticated Vercel assertion flow. Missing trust configuration falls back to the connection address.
- The browser keeps user-provided AI keys in session storage for the current tab session. The web server and API use them only for the upstream request and must not log or persist them.
- PostgreSQL is private in Compose. Production ingress should expose only the web app and the API endpoints deliberately required by the deployment.

## Saved-resume pagination

Resume lists use keyset pagination ordered by `(UpdatedAt, Id)` descending. The cursor contains the final item’s UTC ticks and GUID. Using both values makes the order deterministic when several resumes share a timestamp. The next query asks for rows strictly after that tuple, avoiding the growing scan and unstable duplicates common with offset pagination. The cursor is an opaque navigation token, not an authorisation control; every query is still scoped to the authenticated owner.

Pages contain at most eight summaries. Full document content is fetched only when a resume is opened. An account can store at most 16 resumes.

## Container lifecycle

```mermaid
flowchart LR
    Db[(PostgreSQL healthy)] --> Migration[One-shot EF migration bundle]
    Migration -->|exit 0| Api[API healthy]
    Api --> Web[Next.js healthy]
```

Both application images use separate build and runtime stages and run as non-root users. Compose supplies read-only root filesystems, temporary writable space, health checks, restart policies, resource limits, a private backend network, and a named PostgreSQL volume. A failed migration prevents the API and web app from starting against a partially upgraded schema.

## Failure handling

- Request cancellation propagates through database and provider calls where supported.
- AI calls impose both header and body-read deadlines; receiving headers does not disable the request deadline.
- Malformed saved documents are isolated to the affected card rather than failing an entire dashboard page.
- Oversized parsing requests and whitespace-only payloads are rejected before expensive processing.
- Health checks indicate process reachability. They are not a substitute for provider monitoring or database backups.
