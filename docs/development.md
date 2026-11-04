# Local development

Run the API and web app in separate terminals. The commands below use PowerShell from the repository root.

## Prerequisites

- Node.js 22.13+ or 24+, and npm.
- .NET 10 SDK and EF Core CLI 10.x. Install the CLI with `dotnet tool install --global dotnet-ef --version "10.*"` if you do not already have it.
- PostgreSQL with a local database named `resumade` and credentials that can apply migrations.
- Chrome or Chromium for PDF export and its integration test. PuppeteerSharp can also download Chromium on first use.

## Start the API

Set the database connection and a local JWT signing key of at least 32 ASCII characters. Keep credentials in your shell environment or the API project's .NET user secrets.

```powershell
$env:ConnectionStrings__ResumadeDatabase = 'Host=localhost;Port=5432;Database=resumade;Username=<local-user>;Password=<local-password>'
$env:Jwt__Key = '<replace-with-a-random-local-signing-key-of-at-least-32-characters>'
# Override the allowed browser frontend origins as needed. Array indexes use __0, __1, and so on.
# $env:Cors__AllowedOrigins__0 = 'https://resumade-zeta.vercel.app'
# In production, add the IP of the reverse proxy directly in front of the API.
# $env:Proxy__KnownProxies__0 = '10.0.0.10'
# Optional. Point PuppeteerSharp at a locally installed browser.
# $env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

dotnet restore Resumade.Api.slnx
dotnet ef database update --project api/Resumade.Api.csproj -- --environment Development
dotnet run --project api/Resumade.Api.csproj --launch-profile http
```

The API listens at [localhost:5011](http://localhost:5011). Check [health](http://localhost:5011/api/health), browse the [interactive API reference](http://localhost:5011/scalar/v1), or open the [OpenAPI document](http://localhost:5011/openapi/v1.json).

Apply migrations to the intended local database before testing account operations. The API applies migrations only when you run the EF command. `SimplifyResume` removes the former `IsPrimary`, `Style`, and `ThemeColor` columns.

JWT issuer and audience default to `Resumade` and `ResumadeUsers`. Use `Jwt__Issuer` and `Jwt__Audience` if you need to override them.

## Start the web app

Create `web/.env.local` with these values:

```dotenv
API_URL=http://localhost:5011
AUTH_SECRET=<replace-with-a-long-random-secret>
AUTH_TRUST_HOST=true
```

```powershell
cd web
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Create a local account to try the dashboard, or use **Start building** as a guest to try templates, PDF import, and download.

For Google sign-in, set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `web/.env.local`, set `Google__ClientId` to the same client ID for the API, and register `http://localhost:3000/api/auth/callback/google` as the local callback URL.

To run the HTTPS profile, use `dotnet dev-certs https --trust`, start the API with `--launch-profile https`, and set `API_URL=https://localhost:7131`. If Node needs the local CA, set `NODE_EXTRA_CA_CERTS` to the public certificate PEM before starting the web process.

## Run checks

```powershell
# Repository root, with the API environment variables above
dotnet test Resumade.Api.slnx

# web/
npm run lint
npx tsc --noEmit
```

The API integration suite checks health and anonymous PDF generation. PDF generation launches Chromium. If downloads are unavailable in your test environment, set `PUPPETEER_EXECUTABLE_PATH` before running the suite.

See the [API reference](api.md) for endpoint contracts and the [page gallery](screenshots.md) for the main flows.
