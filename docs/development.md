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

## Continuous integration

GitHub Actions runs **Frontend CI** and **Backend CI** on Ubuntu. Both workflows report a check on pull requests targeting `main`. Each compares the PR merge commit to its base and skips the expensive steps when the changes are outside its scope. Pushes to `main` start only the workflows that match their path filters. Changes under `.github/` or to the root `.gitignore` are in scope for both. Once the workflows are on the default branch, use **Actions → Run workflow** to run either suite in full.

### Frontend checks

Changes under `web/` or to the root `.npmrc` run these checks. CI uses Node.js 24 and caches npm downloads using `web/package-lock.json`. Run the same commands from the repository root in PowerShell.

```powershell
Set-Location web
npm ci
npm run lint
npm exec -- next typegen
npm exec -- tsc --noEmit
npm run build
```

The Next.js build fetches Geist fonts from Google Fonts. Auth.js and API settings are for runtime use.

### Backend checks

Changes under `api/` or `tests/`, to `Resumade.Api.slnx`, or to root .NET and NuGet build configuration run these checks. CI uses .NET SDK 10, caches NuGet packages using both project lockfiles, and uploads xUnit's TRX results for seven days. PDF tests use the runner's Google Chrome with its sandbox enabled. The suite needs a placeholder connection string for API startup and runs without a PostgreSQL service.

Run from the repository root in a fresh PowerShell session. Set the browser path to your local Chrome or Chromium executable, or let PuppeteerSharp download one on first use.

```powershell
dotnet restore Resumade.Api.slnx --locked-mode
dotnet build Resumade.Api.slnx --configuration Release --no-restore

$env:Jwt__Key = 'resumade-ci-signing-key-for-tests-only'
$env:ConnectionStrings__ResumadeDatabase = 'Host=127.0.0.1;Database=unused'
# $env:PUPPETEER_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
dotnet test Resumade.Api.slnx --configuration Release --no-build --results-directory "$env:TEMP/resumade-test-results" --logger 'trx;LogFileName=backend-tests.trx'
```

After changing NuGet dependencies, run `dotnet restore Resumade.Api.slnx --force-evaluate` and commit any updated `packages.lock.json` files with the project changes.

### GitHub settings and branch protection

1. In **Settings → Actions → General**, enable GitHub Actions and allow GitHub-authored actions if the repository restricts which actions can run. Use the read-only default workflow permissions. CI requires no repository secrets.
2. After both checks have succeeded on a PR, create a branch protection rule or ruleset for `main`. Require a pull request and require the GitHub Actions checks **Frontend checks** and **Backend checks**. Both jobs report on every eligible PR because filtering happens inside the job. Workflow-level PR path filters can leave a required check pending. [GitHub's required status check documentation](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks)

### Future Azure Container Apps deployment

A separate deployment workflow can gate releases on a successful backend CI run for the same commit on protected `main`. It can then publish a commit-tagged image to Azure Container Registry and deploy that image as a Container Apps revision. Use a protected GitHub environment and Azure workload identity federation for short-lived credentials. [Azure Container Apps deployment](https://learn.microsoft.com/en-us/azure/container-apps/github-actions) and [GitHub Actions OIDC for Azure](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure)

See the [API reference](api.md) for endpoint contracts and the [page gallery](screenshots.md) for the main flows.
