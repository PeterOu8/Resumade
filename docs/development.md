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

Google-only accounts can sign in again with Google using the same address. An address already registered with a password continues to use password sign-in. If Auth.js displays a generic server error after the Google callback, check the backend for `Google sign-in rejected`. The `password_account_exists` reason indicates a password account, and `invalid_token` warrants checking that the frontend and backend use the same Google client ID.

To run the HTTPS profile, use `dotnet dev-certs https --trust`, start the API with `--launch-profile https`, and set `API_URL=https://localhost:7131`. If Node needs the local CA, set `NODE_EXTRA_CA_CERTS` to the public certificate PEM before starting the web process.

## Transactional email and deployment

The API reads these settings from the hosting environment. Keep the API key in the backend secret store. The Vercel frontend only needs its existing Auth.js and API connection settings.

| Backend setting | Value |
| --- | --- |
| `Resend__ApiKey` | Resend key with sending access to the verified domain |
| `Email__FromAddress` | `noreply@resumade.lisungou.com` |
| `Frontend__BaseUrl` | `https://resumade-zeta.vercel.app` |

For local email testing in Development, use the same verified sender and set `Frontend:BaseUrl` to `http://localhost:3000` in the API project's user secrets. Use `Resend:ApiKey` and `Email:FromAddress` as the hierarchical user-secret keys. Send to a mailbox you control. Automated account tests inject a recording sender.

1. Add `resumade.lisungou.com` under **Domains** in Resend. Publish the SPF and DKIM records shown by Resend in the DNS zone for `lisungou.com`, including the sending subdomain MX record shown in the dashboard. Wait for DNS propagation and click **Verify**.
2. Disable click tracking for this sending domain so email action links open directly on the configured frontend. Use a domain-scoped sending key and configure the backend environment variables above. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction)
3. Back up the database and apply the migrations through `20261105010200_AddAccountSecurity` before deploying the API and frontend together. Run `dotnet ef database update --project api/Resumade.Api.csproj` with the target database connection and existing API settings in the environment.
4. After deployment, exercise signup, verification, password reset and Google sign-in with test accounts. Check Resend delivery events and the backend's account email warning count if a message fails to arrive.

Existing password accounts retain their passwords and resumes. They must verify their address before signing in. Use the API’s resend-verification endpoint to send a link for an existing unverified account. Existing Google accounts are marked verified after their next successful Google sign-in. Older API tokens lack the required security-version claim and become invalid at deployment. Sessions end at the one-hour API token deadline, even if Auth.js has renewed the cookie. Users sign in again when the session ends.

The IP limiter runs per API instance. Next.js sends auth requests from the server, so users sharing an outbound address may share its quota. PostgreSQL enforces per-account email limits across instances. Email requests return a generic response and send synchronously, so delivery can affect response timing. Failed sends count toward the cooldown and can be retried after the limit clears.

Run the PostgreSQL account lifecycle integration test with `RESUMADE_AUTH_TEST_POSTGRES` set to a dedicated test database connection. Its role needs permission to create schemas. The test applies the migration chain in a temporary schema and removes the schema afterwards.

## Continuous integration

GitHub Actions runs **Frontend CI** and **Backend CI** on Ubuntu. Both workflows report a check on pull requests targeting `main`. Each compares the PR merge commit to its base and skips the expensive steps when the changes are outside its scope. Pushes to `main` start only the workflows that match their path filters. Changes under `.github/` or to the root `.gitignore` are in scope for both. Once the workflows are on the default branch, use **Actions → Run workflow** to run either suite in full.

### Frontend checks

Changes under `web/` or to the root `.npmrc` run these checks. CI uses Node.js 24 and caches npm downloads using `web/package-lock.json`. Run the same commands from the repository root in PowerShell.

```powershell
Set-Location web
npm ci
npm run lint
node --test scripts/auth.test.mjs
npm exec -- next typegen
npm exec -- tsc --noEmit
npm run build
```

The Next.js build fetches Geist fonts from Google Fonts. Auth.js and API settings are for runtime use.

### Backend checks

Changes under `api/` or `tests/`, to `Resumade.Api.slnx`, or to root .NET and NuGet build configuration run these checks. CI uses .NET SDK 10, caches NuGet packages using both project lockfiles, and uploads xUnit's TRX results for seven days. PDF tests use the runner's Google Chrome with its sandbox enabled. CI runs the account lifecycle test against a disposable PostgreSQL service. For local runs, set `RESUMADE_AUTH_TEST_POSTGRES` as described above to include that test.

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

### Deploy the API to Azure Container Apps

1. Build the Linux image from the repository root with `docker build --platform linux/amd64 -t resumade-api:local api`. The image listens on port 8080 and includes Chrome and fonts. The API runs as a non-root user and requires Chromium sandboxing for PDF export.
2. Push the release commit to `main`. After backend tests pass, Backend CI builds the image, checks `/api/health`, and publishes `ghcr.io/peterou8/resumade-api:<commit-sha>`. On the first release, open the GitHub package settings and set visibility to Public for anonymous pulls.
3. Confirm the existing PostgreSQL database has the migrations in this guide. Create a Consumption Container Apps environment. Select **Don't save logs** to use live log streaming without storing logs in Log Analytics.
4. Create the Container App from the commit-tagged image. Enable external HTTPS ingress, disable insecure connections, and set the target port to 8080. Start with 0.5 vCPU, 1 GiB RAM, and zero to one replicas. Set an HTTP readiness probe on `/api/health`.
5. Reference Azure Container App secrets from `ConnectionStrings__ResumadeDatabase`, `Jwt__Key`, and `Resend__ApiKey`. Set `Google__ClientId` to the frontend Google client ID. Use the sender, frontend base URL, and allowed frontend origin from this guide.
6. Verify `/api/health` over the app's public HTTPS URL. Set Vercel's production `API_URL` to that origin and redeploy the frontend. The Google OAuth callback remains on the frontend.
7. Test registration and verification, returning Google sign-in, resume storage, and PDF import and export. Test PDF export in the Azure revision because Chromium depends on the hosting environment's sandbox support.

Consumption usage above the free allowance can incur charges. [Azure Container Apps pricing](https://azure.microsoft.com/en-us/products/container-apps/)

See the [API reference](api.md) for endpoint contracts and the [page gallery](screenshots.md) for the main flows.
