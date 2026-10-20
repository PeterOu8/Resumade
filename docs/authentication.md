# Authentication

Resumade uses stateless JWT bearer access tokens for its API. User emails are trimmed and stored with a normalized, unique lookup value, while the display email preserves user-entered casing. Passwords are hashed with ASP.NET Core Identity's maintained `PasswordHasher` implementation; plaintext passwords are never persisted.

Set development secrets from `src/Resumade.Api` before running the API:

```powershell
dotnet user-secrets set "ConnectionStrings:ResumadeDatabase" "Host=localhost;Database=resumade;Username=postgres;Password=..."
dotnet user-secrets set "Jwt:SigningKey" "a-unique-random-secret-with-at-least-32-characters"
```

The API will fail fast when the JWT signing key is absent or too short. Production must supply the same values through its secret manager or environment configuration, never source control.

The EF design-time factory reads the same user-secrets ID. From the repository root, run `dotnet ef database update --project src/Resumade.Api` using the configured development connection string. Existing migrations retain their IDs and database schema; no new migration is required for the consolidation.

Current endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (bearer token required)

Future resource endpoints must derive the requesting user from the validated `sub` claim and enforce resource ownership in the application use case.
