# End-to-end project audit — 2026-09-14

## Basis and limits

The referenced “Project Scope Review” conversation contains only the request for an audit; it does not contain an earlier scope specification or delivered audit. This review therefore treats `README.md`, `docs/portfolio/project-summary.md`, `docs/architecture/*.md`, `docs/ownership.md`, `docs/authentication.md`, `docs/file-storage.md`, `docs/deployment.md`, the public API surface, and tests as the available scope baseline.

The worktree was already dirty. Findings involving `apps/web/src/app/api/export/route.tsx`, `docker-compose.override.yml`, and other modified files describe the current working tree and should be reconciled with the work in progress before cleanup.

## Executive assessment

The resume, identity, profile, job, and processing foundations generally preserve the intended Domain → Application ← Infrastructure dependency direction. The project nevertheless reads as two partially joined products: a legacy Next.js upload/tailor/PDF flow and a newer authenticated .NET modular monolith. The largest risks are missing cross-aggregate ownership validation, missing relational constraints, application logic placed in Infrastructure, an incomplete tailoring workflow, and deployment/CI configuration that is not reproducible from a clean checkout.

Severity scale: **Critical** permits cross-tenant disclosure or destructive compromise; **High** breaks a core workflow, tenant/data integrity, or production delivery; **Medium** creates material architectural/operational debt; **Low** is cleanup or convention drift. No confirmed Critical issue was found in this static audit.

## 1. Scope deviations

1. **High — The frontend still implements a separate, unauthenticated legacy product path.** `apps/web/src/app/page.tsx:10-27` sends uploads through local Next routes, and `apps/web/src/app/api/tailor/route.ts:145-189` is a second AI tailoring implementation. It bypasses the authenticated .NET resume, job, analysis, versioning, grounding, and persistence workflows promised by `README.md` and `docs/portfolio/project-summary.md`. Worse, line 146 returns hard-coded personal resume data, making lines 147-189 permanently unreachable.
2. **High — The frontend and backend authentication contracts do not connect.** `apps/web/src/lib/api-client.ts:2-4` sends cookies (`credentials: 'include'`), but the API is bearer-token-only (`apps/api/Resumade.Api/Program.cs:91-116`). There is no login/register UI or token attachment, so dashboard/application calls fail with 401 and silently render empty state (`apps/web/src/app/dashboard/page.tsx:1`, `apps/web/src/app/applications/page.tsx:1`).
3. **Medium — “.NET-first” still depends operationally on the web server for document extraction.** `apps/api/Resumade.Infrastructure/BackgroundJobs/HttpResumeTextExtractor.cs:10-36` posts stored files back to Next.js `/api/parse`; the web also depends on the API. This creates a deployment-level cycle and contradicts the expectation that the web is a client/foundation rather than an API dependency.
4. **Medium — Documentation no longer matches implemented trust behavior.** `docs/architecture/ai-integration.md` says trusted mapping is a later step, while `apps/api/Resumade.Infrastructure/Persistence/ResumeProcessingRepository.cs:60-95` validates and immediately maps a draft into a trusted imported version.
5. **Medium — Claimed features are skeletal rather than end-to-end.** The portfolio summary claims RAG/vector search, interview practice, application tracking, notifications, and responsive workspace. RAG has no ingestion/chunking/embedding persistence path, interview questions are static, notifications are user-created records, and the frontend exposes only thin job/application read views.

## 2. Unnecessary, obsolete, duplicate, generated, or misplaced files

### Remove or review for removal

- **Low — Template debris:** `apps/api/Resumade.Domain/Class1.cs`, `apps/api/Resumade.Application/Class1.cs`, and `apps/api/Resumade.Infrastructure/Class1.cs` are unused scaffolding.
- **Low — IDE-local file committed:** `apps/api/Resumade.Api/Resumade.Api.csproj.user` should be removed and `*.csproj.user` ignored.
- **Low — Default Next assets appear unused:** `apps/web/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, and `window.svg` have no repository references.
- **Low — Obsolete placeholder entity/table:** `apps/api/Resumade.Domain/Common/SystemRecord.cs`, its DbSet/configuration, and the `system_records` migration history have no use case. Do not rewrite applied migrations; remove the model via a forward migration if databases exist.
- **Low — Empty project folder declarations:** the `<Folder Include=...>` entries in the three API `.csproj` files do not add runtime value and several describe folders that are empty or no longer follow the actual layout.
- **Medium — Duplicate AI/client contract:** `apps/web/src/app/api/tailor/route.ts` duplicates the .NET `IResumeTailor` adapter and contains unreachable production code plus embedded sample personal data. Retain only if explicitly designated as a mock/demo route and gated to development.
- **Medium — Duplicate API DTO families are drifting:** Application-layer contracts and `apps/api/Resumade.Api/Contracts/*` are reasonable boundary types, but newer controllers return Domain entities directly instead of API contracts. Standardize rather than deleting both sets.
- **Review current rename:** tracked `apps/web/src/app/api/export/route.ts` is deleted and untracked `route.tsx` replaces it. The `.tsx` extension is required for JSX, but the change must be committed as a rename; the deleted version also had an unused OpenAI realtime import.

### Keep

- EF migration `*.Designer.cs` files and `ResumadeDbContextModelSnapshot.cs` are generated but required migration metadata, not cleanup candidates.
- `package-lock.json` is required for reproducible `npm ci`.
- `Resumade.Api.http` is optional developer documentation; keep if the team actively uses it.

## 3. Missing domain pieces

1. **High — Cross-aggregate invariants and ownership checks.** `ApplicationService.CreateAsync` (`apps/api/Resumade.Application/Applications/ApplicationService.cs:7`) accepts arbitrary `JobId` and `ResumeVersionId` without proving both belong to the current user. `InterviewService.CreateAsync` (`apps/api/Resumade.Infrastructure/Interviews/InterviewService.cs:3`) likewise accepts any job ID. Add application-layer readers/policies that resolve owned aggregates before creation.
2. **High — Relational integrity for later modules.** `JobApplicationConfiguration.cs:3`, `InterviewConfiguration.cs:1`, `ResumeChunkConfiguration.cs:1`, and `NotificationConfiguration.cs:1` lack user/job/resume-version/document FKs. Orphan and cross-user references are possible; job/user/document deletion semantics are undefined.
3. **High — Complete tailoring semantics.** `ResumeTailoringService.cs:16` ignores stored job analysis and supplies an empty fabricated draft. `TailoredResumeRepository.cs:16-25` copies only AI-mentioned experiences/projects, omits education and skills, and `ResumeTailoringService.cs:19` returns empty child lists even after persistence. This violates the documented snapshot/version model.
4. **Medium — Application state-transition rules.** `JobApplication.ChangeStatus` (`Domain/Applications/JobApplication.cs:13-14`) permits every transition, does not clear/reconcile `AppliedAt`, and records no actor/reason. Define an explicit transition graph and invariants.
5. **Medium — Interview aggregate/workflow.** Missing job ownership validation, job-analysis-driven question generation, answer validation beyond score clamping, completion rules/timestamp, list/delete endpoints, and application linkage.
6. **Medium — RAG model/workflow.** Missing chunk creation/update/delete orchestration, stable ordering/source offsets, embedding/vector field, embedding model/version, vector index/query adapter, and synchronization when a document is replaced/deleted. `RagService` is currently substring search only (`Infrastructure/Rag/RagService.cs:3`).
7. **Medium — Domain events/outbox.** No event mechanism exists for document uploaded/processed/failed, application status changed, interview completed, or notification creation. Direct polling is adequate for the current processing slice, but claimed cross-module coordination needs explicit events and durable publication if side effects are added.
8. **Medium — Concurrency control.** Version numbers are calculated with `Max()+1` in `ResumeProcessingRepository.cs:71` and `TailoredResumeRepository.cs:14`; concurrent processing/tailoring can violate the unique constraint. No optimistic concurrency token or retry translates this into a domain conflict.
9. **Medium — Validation consistency.** Older resume/profile DTOs use data annotations, but one-line controllers and services accept unconstrained notification titles/messages, interview answers, RAG queries, and IDs. Domain constructors also omit non-empty GUID and bounded-text rules in several newer entities.
10. **Medium — Missing tests/documentation.** No behavioral tests cover applications, interviews, notifications, RAG, tailoring end-to-end, semantic endpoints, deletion cascades, concurrency, worker recovery at max attempts, or production configuration. Architecture documentation covers only resume/AI boundaries and omits module dependency/contract diagrams and lifecycle ownership for newer features.

## 4. Domain/infrastructure/architecture coordination issues

1. **High — Application use cases leak into Infrastructure.** API directly references `Resumade.Infrastructure.Interviews`, `.Notifications`, and `.Rag` (`Program.cs:15-17,43-45`; corresponding controllers import Infrastructure). Move service interfaces/use cases/results to Application; leave EF repositories and external adapters in Infrastructure.
2. **High — Domain entities leak across the HTTP boundary.** `InterviewsController`, `NotificationsController`, and `RagController` return tracked/domain objects directly. This couples wire contracts to EF/domain shape and makes future navigation properties or private data an accidental API change. Map explicit request/response DTOs.
3. **High — Processing adapter topology is fragile.** The API-to-web extractor endpoint defaults to `localhost:3000` (`appsettings.json:25-26`) and the untracked override uses `host.docker.internal`. Within Compose the stable address should be the service DNS name (for example `http://web:3000/api/parse`); `host.docker.internal` is environment-specific. Better, place extraction in an Infrastructure library/service that the worker owns.
4. **High — Tailoring uses an uncoordinated job contract.** Job analysis is persisted by `JobAnalysisService`, but tailoring neither reads it nor requires it, while matching/ATS have separate analysis readers. Establish one job-analysis port and a clear “analyze before tailor/match” policy or fallback.
5. **Medium — Application repository placement/conventions drift.** Most ports live in Application and implementations in Infrastructure, but `ITailoredResumeRepository` is in a file named like an implementation (`Application/Resumes/TailoredResumeRepository.cs`), while interview/RAG/notification skip ports entirely. Use consistent `I*Repository`/use-case contracts.
6. **Medium — Persistence is the trusted mapper.** `ResumeProcessingRepository.AddTrustedChildren` contains date parsing and domain mapping (`lines 99-135`). This is application/domain policy embedded in EF infrastructure. Move normalization/mapping to an Application service/domain factory, then make persistence save an already-valid aggregate.
7. **Medium — Cross-module deletion behavior is undefined.** Resume ownership cascades are documented, but job→analysis is the only configured job child. Applications and interviews can outlive jobs; chunks can outlive documents; user-owned later-module rows lack User FKs.
8. **Medium — API error handling is incomplete.** Provider/domain exceptions thrown by analysis, matching, tailoring, and constructor validation have no centralized exception-to-ProblemDetails middleware. Likely outcomes are generic 500 responses with inconsistent semantics.
9. **Medium — Frontend/API contract mismatch and silent failure.** The handwritten client exposes only four calls, lacks generated/shared schemas, assumes JSON for every successful response, and swallows errors in pages. Backend route/DTO evolution is therefore not checked at compile time.
10. **Medium — Delivery path is incomplete.** `.github/workflows/ci.yml:17` runs `dotnet test --no-restore` without a restore step on a clean runner. Integration tests require a configured database, but CI does not set the expected connection/JWT variables. The web build imports an environment schema requiring `OPENAI_API_KEY`; the successful local build used `.env.local`, which CI will not have.
11. **Medium — Compose is development-only but presented as the local/production foundation.** No database or upload volume is declared, no migration/init job runs, no healthchecks gate dependencies, no API AI key/model configuration is supplied, and the upload root in the current override is ephemeral container storage.
12. **Low — Composition root is becoming a service-locator list.** `Program.cs:37-82` is manually registering every slice. Module-level registration extensions would keep boundaries visible and make missing registrations/tests easier to detect.

No compile-time circular project reference was found: Domain has no project reference, Application references Domain, Infrastructure references Application/Domain, and API references Application/Infrastructure. The significant cycles are runtime/deployment (web → API and API → web) and responsibility cycles (persistence performing application/domain policy).

## 5. Risk register

| Severity | Risk | Evidence / impact |
|---|---|---|
| High | Invalid or cross-tenant aggregate references | Arbitrary job/resume-version IDs accepted; missing FKs permit corrupt application/interview data |
| High | Core UI cannot authenticate to API | Cookie client vs bearer API; failures are hidden as empty states |
| High | Tailored versions are incomplete/inaccurate | Stored analysis ignored; child data omitted; response disagrees with persisted state |
| High | Production/CI cannot be reproduced safely | clean-runner restore/config gaps; ephemeral DB/uploads; extractor addressing |
| High | Architectural boundary erosion | API depends on Infrastructure use-case services and serializes Domain entities |
| Medium | Processing/tailoring race | `Max()+1` can collide under concurrency |
| Medium | RAG/interview/notification scope overstatement | endpoints exist without the required lifecycle and integration workflows |
| Medium | Inconsistent failures and weak input limits | no global ProblemDetails mapping; newer slices lack validation |
| Low | Repository noise | template classes, IDE file, default assets, empty folder entries |

## 6. Prioritized remediation

### P0 — Restore integrity and a single product path

1. Add owned-job and owned-resume-version lookup ports and validate them transactionally in application creation and interview creation. Add corresponding FKs/indexes/delete behaviors through a new migration and cross-user integration tests.
2. Choose the canonical UI workflow. Recommended: make Next.js a bearer-aware client of the .NET API; replace the legacy `/api/tailor` mock route and local-only state with persisted resume/job/analyze/tailor calls. Add login/register/session handling and visible error states.
3. Fix tailoring to load the persisted analysis, preserve/copy all required snapshot children, return a fully mapped saved version, and retry/serialize version allocation.

### P1 — Re-establish module boundaries

4. Create Application-layer interview, notification, and RAG use cases plus repository ports/results. Move EF code to implementations and map explicit API DTOs. Add a real architecture test (reflection or NetArchTest-style) that forbids Domain→outer, Application→Infrastructure/API, and API controller→Infrastructure feature-service dependencies.
5. Move parsing-draft normalization/trusted aggregate construction out of `ResumeProcessingRepository`. Reconcile `docs/architecture/ai-integration.md` with the chosen approval/trust workflow.
6. Decide extraction ownership: embed supported PDF/DOCX extraction in .NET Infrastructure or deploy it as an explicit independent service. Remove the API→web dependency and document timeouts, limits, retry semantics, and health checks.
7. Add centralized ProblemDetails exception mapping and consistent request validation for every controller.

### P2 — Complete workflows and delivery

8. Implement RAG ingestion/synchronization and vector persistence/search, or rename/remove RAG claims and endpoints until it exists. Define events/outbox only where durable cross-module side effects are needed.
9. Define application transitions, interview lifecycle, notification provenance, and deletion policies in domain docs and tests.
10. Make CI clean-checkout reproducible: restore before `--no-restore` (or remove the flag), configure test DB/JWT, apply migrations, provide a non-secret build-time web strategy, and run lint/typecheck explicitly.
11. Add Compose volumes, healthchecks, migration execution, secrets guidance, and correct service discovery. Separate development overrides from production documentation.

### P3 — Cleanup and consistency

12. Remove the three `Class1.cs` files, `.csproj.user`, unused SVGs, dead mock/sample AI code, and obsolete project folder declarations after confirming no active branch depends on them. Remove `SystemRecord` with a forward migration if deployed databases exist.
13. Format the compressed one-line newer slices, adopt consistent contracts/repository naming, and expand module/API/lifecycle documentation.

## Verification performed

- `dotnet test apps/api/Resumade.slnx --no-restore`: 18 unit tests and 16 integration tests passed locally.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed locally using `.env.local`.
- Static review covered all tracked/untracked paths, project references, controllers, services, domain entities, EF configurations/migrations, frontend routes/client/pages, Docker Compose, CI, and architecture/ownership/deployment documentation.

Passing tests do not reduce the severity of uncovered invariants: `tests/Resumade.UnitTests/ArchitectureTests.cs:4-8` currently verifies only that its own test DLL exists and provides no boundary enforcement.
