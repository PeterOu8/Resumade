# Local development

Use Docker Compose for the shortest setup, or run the API and web app separately for active development. Commands use PowerShell from the repository root.

## Docker Compose quick start

Prerequisites are Docker Desktop (or Docker Engine with Compose v2) and available ports 3000 and 5011.

```powershell
Copy-Item .env.example .env
# Replace POSTGRES_PASSWORD, JWT_KEY, and AUTH_SECRET in .env.
docker compose up --build
```

Compose starts PostgreSQL, waits for it to become healthy, applies the EF Core migration bundle once, starts the API, and starts the web app only after the API is healthy. Open [localhost:3000](http://localhost:3000). The database is not published to the host. API access on port 5011 is bound to loopback for diagnostics.

The example environment uses `ASPNETCORE_ENVIRONMENT=Development` so local HTTP account links are valid. Set it to `Production` together with an HTTPS `WEB_ORIGIN` in a deployed environment.

```powershell
docker compose ps
docker compose logs --follow api web
docker compose down
```

`docker compose down` retains the `resumade-postgres-data` volume. Back it up before upgrades. Deleting the volume permanently deletes local accounts and resumes.

The Compose images run as unprivileged users with read-only root filesystems and temporary `/tmp` mounts. Production deployments should terminate TLS at a reverse proxy, use a managed secret store, and use separate database migration credentials when the platform supports them.

## Prerequisites

- Node.js 22.13+ or 24+, and npm.
- .NET 10 SDK. Restore the repository-pinned EF Core CLI with `dotnet tool restore --tool-manifest api/.config/dotnet-tools.json`.
- PostgreSQL with a local database named `resumade` and credentials that can apply migrations.

## Start the API

Set the database connection and a local JWT signing key of at least 32 ASCII characters. Keep credentials in your shell environment or the API project's .NET user secrets.

```powershell
$env:ConnectionStrings__ResumadeDatabase = 'Host=localhost;Port=5432;Database=resumade;Username=<local-user>;Password=<local-password>'
$env:Jwt__Key = '<replace-with-a-random-local-signing-key-of-at-least-32-characters>'
# Override the allowed browser frontend origins as needed. Array indexes use __0, __1, and so on.
# $env:Cors__AllowedOrigins__0 = 'https://resumade-zeta.vercel.app'
# In production, add the IP of the reverse proxy directly in front of the API.
# $env:Proxy__KnownProxies__0 = '10.0.0.10'

dotnet restore Resumade.Api.slnx
dotnet tool restore --tool-manifest api/.config/dotnet-tools.json
dotnet tool run dotnet-ef database update --project api/Resumade.Api.csproj -- --environment Development
dotnet run --project api/Resumade.Api.csproj --launch-profile http
```

The API listens at [localhost:5011](http://localhost:5011). Check [health](http://localhost:5011/api/health), browse the [interactive API reference](http://localhost:5011/scalar/v1), or open the [OpenAPI document](http://localhost:5011/openapi/v1.json).

Apply migrations to the intended local database before testing account operations. The API applies migrations only when you run the EF command. `SimplifyResume` removes the former `IsPrimary`, `Style`, and `ThemeColor` columns.

JWT issuer and audience default to `Resumade` and `ResumadeUsers`. Use `Jwt__Issuer` and `Jwt__Audience` if you need to override them.

## Configuration reference

ASP.NET Core maps a double underscore to a configuration section separator. For example, `Jwt__Key` maps to `Jwt:Key`.

| Variable | Service | Required | Purpose |
| --- | --- | --- | --- |
| `ConnectionStrings__ResumadeDatabase` | API/migration | Yes | PostgreSQL connection string |
| `Jwt__Key` | API | Yes | HMAC signing key; use at least 32 random characters |
| `Jwt__Issuer`, `Jwt__Audience` | API | Defaults supplied | JWT validation scope |
| `Cors__AllowedOrigins__0` | API | Yes | Exact public web origin |
| `Proxy__KnownProxies__0` | API | No | Immediate trusted reverse-proxy IP |
| `Proxy__WebToken` | API | Vercel forwarding only | 64-character hexadecimal web-to-API credential |
| `Google__ClientId` | API | Google sign-in only | Expected Google token audience |
| `Resend__ApiKey`, `Email__FromAddress` | API | Email delivery only | Transactional email credentials |
| `Frontend__BaseUrl` | API | Email delivery only | Absolute origin used in account-action links |
| `API_URL` | Web | Yes | Server-side API origin |
| `AUTH_SECRET` | Web | Yes | Auth.js signing/encryption secret |
| `AUTH_TRUST_HOST` | Web | Behind a trusted host | Allows Auth.js to derive its public host |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Web | Google sign-in only | Google OAuth client credentials |
| `RESUMADE_PROXY_TOKEN` | Web | Vercel forwarding only | Must match `Proxy__WebToken` |

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

The Download button builds the PDF in the browser from the current structured draft, section order, paper size, margins, theme, and template settings. React PDF produces selectable text and uses locally served EB Garamond files for the Classic template. The live HTML preview remains the editor display and is not sent to the backend. Rich-text markup is parsed into supported PDF text and list elements; scripts, styles, templates, SVG, MathML, event handlers, and unsafe link protocols are never passed to a browser HTML renderer. Run `npm test` to render all three templates and verify PDF signatures, selectable content, filenames, and A4/Letter dimensions.

For Google sign-in, set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `web/.env.local`, set `Google__ClientId` to the same client ID for the API, and register `http://localhost:3000/api/auth/callback/google` as the local callback URL.

Google-only accounts can sign in again with Google using the same address. An address already registered with a password continues to use password sign-in. If Auth.js displays a generic server error after the Google callback, check the backend for `Google sign-in rejected`. The `password_account_exists` reason indicates a password account, and `invalid_token` warrants checking that the frontend and backend use the same Google client ID.

To run the HTTPS profile, use `dotnet dev-certs https --trust`, start the API with `--launch-profile https`, and set `API_URL=https://localhost:7131`. If Node needs the local CA, set `NODE_EXTRA_CA_CERTS` to the public certificate PEM before starting the web process.

## Transactional email and deployment

The API reads these settings from the hosting environment. Keep the email API key in the backend secret store.

| Backend setting | Value |
| --- | --- |
| `Resend__ApiKey` | Resend key with sending access to the verified domain |
| `Email__FromAddress` | `noreply@resumade.lisungou.com` |
| `Frontend__BaseUrl` | `https://resumade-zeta.vercel.app` |

For local email testing in Development, use the same verified sender and set `Frontend:BaseUrl` to `http://localhost:3000` in the API project's user secrets. Use `Resend:ApiKey` and `Email:FromAddress` as the hierarchical user-secret keys. Send to a mailbox you control. Automated account tests inject a recording sender.

1. Add `resumade.lisungou.com` under **Domains** in Resend. Publish the SPF and DKIM records shown by Resend in the DNS zone for `lisungou.com`, including the sending subdomain MX record shown in the dashboard. Wait for DNS propagation and click **Verify**.
2. Disable click tracking for this sending domain so email action links open directly on the configured frontend. Use a domain-scoped sending key and configure the backend environment variables above. [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction)
3. Back up the database and apply the migrations through `20261105023732_IndexResumePagination` before deploying the API and frontend together. Run the migration bundle or `dotnet tool run dotnet-ef database update --project api/Resumade.Api.csproj` with the target database connection and existing API settings in the environment.
4. After deployment, exercise signup, verification, password reset and Google sign-in with test accounts. Check Resend delivery events and the backend's account email warning count if a message fails to arrive.

Existing password accounts retain their passwords and resumes. They must verify their address before signing in. Use the API’s resend-verification endpoint to send a link for an existing unverified account. Existing Google accounts are marked verified after their next successful Google sign-in. Older API tokens lack the required security-version claim and become invalid at deployment. Sessions end at the one-hour API token deadline, even if Auth.js has renewed the cookie. Users sign in again when the session ends.

Verification and password-reset links put the random token in the URL fragment. The browser action reads that fragment and submits the token explicitly, keeping it out of the initial HTTP request, server access logs, and referrer data. The database stores SHA-256 token hashes. Verification tokens last 24 hours, reset tokens last 30 minutes, redemption consumes every outstanding token for the same purpose, and successful password reset increments the account security version to invalidate existing API tokens. Registration, resend, and recovery responses avoid revealing whether an address exists. Do not log action URLs, raw tokens, recipient addresses, or provider response bodies.

The IP limiter runs per API instance. PostgreSQL enforces per-account email limits across instances. Email requests return a generic response and send synchronously, so delivery can affect response timing. Failed sends count toward the cooldown and can be retried after the limit clears.

### Forward client IPs from Vercel

For each Vercel/Azure environment, generate a separate 32-byte random secret encoded as 64 hexadecimal characters. Set it as `Proxy__WebToken` in the Azure API secret configuration and as `RESUMADE_PROXY_TOKEN` in the Vercel server environment. Use an HTTPS `API_URL` and enable Vercel's system environment variables so the server can check `VERCEL=1`. Keep the token out of source control, client-visible environment variables, and request logs.

Enable forwarding only when Vercel controls the inbound `X-Forwarded-For` header. If another proxy sits in front of Vercel, verify the header's provenance and the IP it represents before enabling the feature. Deploy the API with its secret first, then deploy the web app with the matching secret. When the token or client IP is missing or rejected, the API uses its connection address after normal trusted-proxy processing, so users can share a quota during a configuration mismatch.

After deployment, exhaust the AI route quota from one public IP and verify that a second public IP still reaches request validation or the AI provider. Check that direct API requests with forged assertions still share their normal connection quota and that API throttling sends `Retry-After`.

Run the PostgreSQL account lifecycle integration test with `RESUMADE_AUTH_TEST_POSTGRES` set to a dedicated test database connection. Its role needs permission to create schemas. The test applies the migration chain in a temporary schema and removes the schema afterwards.

## Continuous integration

GitHub Actions runs **Frontend CI** and **Backend CI** on Ubuntu. Both workflows report a check on pull requests targeting `main`. Each compares the PR merge commit to its base and skips expensive checks outside its scope. Frontend CI runs on pushes that change the web app or shared workflow files. Backend CI runs on every push to `main`; after its checks pass, it publishes the commit-tagged API image, applies pending production migrations through a migration bundle, and then deploys the image. Once the workflows are on the default branch, use **Actions → Run workflow** to run either suite in full.

### Frontend checks

Changes under `web/` or to the root `.npmrc` run these checks. CI uses Node.js 24 and caches npm downloads using `web/package-lock.json`. Run the same commands from the repository root in PowerShell.

```powershell
Set-Location web
npm ci
npm run lint
node --test scripts/auth.test.mjs
npm test
npm exec -- next typegen
npm exec -- tsc --noEmit
npm run build
```

The Next.js build fetches Geist fonts from Google Fonts. Auth.js and API settings are for runtime use. The container build emits and runs Next.js standalone output rather than shipping development dependencies.

### Backend checks

Changes under `api/` or `tests/`, to `Resumade.Api.slnx`, or to root .NET and NuGet build configuration run these checks on pull requests. CI uses .NET SDK 10, caches NuGet packages using both project lockfiles, and uploads xUnit's TRX results for seven days. CI runs the account lifecycle test against a disposable PostgreSQL service. For local runs, set `RESUMADE_AUTH_TEST_POSTGRES` as described above to include that test.

Run from the repository root in a fresh PowerShell session.

```powershell
dotnet restore Resumade.Api.slnx --locked-mode
dotnet build Resumade.Api.slnx --configuration Release --no-restore

$env:Jwt__Key = 'resumade-ci-signing-key-for-tests-only'
$env:ConnectionStrings__ResumadeDatabase = 'Host=127.0.0.1;Database=unused'
dotnet test Resumade.Api.slnx --configuration Release --no-build --results-directory "$env:TEMP/resumade-test-results" --logger 'trx;LogFileName=backend-tests.trx'
```

After changing NuGet dependencies, run `dotnet restore Resumade.Api.slnx --force-evaluate` and commit any updated `packages.lock.json` files with the project changes.

### GitHub settings and branch protection

1. In **Settings → Actions → General**, enable GitHub Actions and allow GitHub-authored actions if the repository restricts which actions can run. Use read-only workflow permissions by default. The deployment job grants `id-token: write` only for its Azure OIDC login.
2. After both checks have succeeded on a PR, create a branch protection rule or ruleset for `main`. Require a pull request and require the GitHub Actions checks **Frontend checks** and **Backend checks**. Both jobs report on every eligible PR because filtering happens inside the job. Workflow-level PR path filters can leave a required check pending. [GitHub's required status check documentation](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks)

### Deploy the API to Azure Container Apps

1. Build the Linux image from the repository root with `docker build --platform linux/amd64 -t resumade-api:local api`. The image listens on port 8080 and runs as the unprivileged user from the official .NET runtime image.
2. On the first release, open the GHCR package settings and make `resumade-api` public so Azure Container Apps can pull it without registry credentials.
3. Add `NEON_MIGRATION_CONNECTION` as a GitHub Actions repository secret. Use Neon's direct connection string; its hostname must not contain `-pooler`. The migration role needs schema-change permission. Create a Consumption Container Apps environment and select **Don't save logs** to use live log streaming without storing logs in Log Analytics.
4. Create the Container App from the commit-tagged image. Enable external HTTPS ingress, disable insecure connections, and set the target port to 8080. Start with 0.5 vCPU, 1 GiB RAM, and zero to one replicas. Set an HTTP readiness probe on `/api/health`.
5. Reference Azure Container App secrets from `ConnectionStrings__ResumadeDatabase`, `Jwt__Key`, and `Resend__ApiKey`. Set `Google__ClientId` to the frontend Google client ID. Use the sender, frontend base URL, and allowed frontend origin from this guide.
6. Create a Microsoft Entra application and federated credential for this repository's `production` GitHub environment. Grant it the least Azure role that can update the target Container App. Add `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` as production-environment secrets. Add `AZURE_RESOURCE_GROUP` and `AZURE_CONTAINER_APP_NAME` as production-environment variables.
7. Push to `main`. Backend CI tests the API, builds and health-checks the image, pushes `ghcr.io/<owner>/resumade-api:<commit-sha>`, applies only pending EF Core migrations to Neon, signs in to Azure through OIDC, and updates the Container App to that immutable tag. A failed migration prevents deployment of the new image.
8. Verify `/api/health` over the app's public HTTPS URL. Set Vercel's production `API_URL` to that origin and redeploy the frontend. Test signup, email verification, password recovery, Google sign-in, resume storage, PDF import, and browser-generated PDF download.

Consumption usage above the free allowance can incur charges. [Azure Container Apps pricing](https://azure.microsoft.com/en-us/products/container-apps/)

See the [API reference](api.md) for endpoint contracts and the [page gallery](screenshots.md) for the main flows.
