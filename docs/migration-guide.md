# Migration guide

This guide covers the resume pagination, storage limit, startup refactor, and full-stack container changes introduced together.

## Before deployment

1. Back up PostgreSQL and verify that the backup can be restored.
2. Deploy the web app and API as one release because the resume-list response contract changed.
3. Configure the required secrets: database connection/password, `Jwt__Key`, and `AUTH_SECRET`.
4. If transactional email or Google sign-in is enabled, configure those provider credentials before testing account flows.
5. Apply migrations through `20261105023732_IndexResumePagination` using the supplied migration bundle or the pinned local EF tool.

Compose performs step 5 with the one-shot `migrate` service. On another platform, run the bundle as a release job before starting the new API. A separate database role with schema-change permission is preferred; the runtime API role should have only application data permissions.

## Contract changes

`GET /api/resumes` no longer returns a bare array. It returns:

```json
{
  "items": [],
  "nextCursor": null
}
```

The default and maximum page size is eight. Pass `nextCursor` back as the `cursor` query parameter to fetch the next page. Treat the cursor as opaque. Clients that still expect an array must be upgraded with the API.

Creating a seventeenth resume returns HTTP `409`. Existing drafts remain editable and downloadable, and users can delete a saved resume before saving another. The database update adds the owner/update/id index used by keyset pagination; it does not delete existing resumes above the limit.

## Internal refactors

- Create and update now share `SaveResumeDto`. The external JSON shape is unchanged.
- Cursor parsing and formatting moved from the controller into `ResumeCursor`.
- API host composition moved from `Program.cs` into `Infrastructure/Configuration`.
- AI connection validation and API problem parsing are shared by the Next.js route handlers.
- Unused legacy AI proxy message types and the user-specific project file were removed.
- Internal names and user-facing copy use Australian English where it does not conflict with framework, protocol, provider, database, or public JSON identifiers.

These are source-level changes only unless a consumer compiled directly against the API assembly, which is not a supported integration surface.

## Container changes

- The API image now includes a pinned EF CLI build step and a self-contained `/app/migrate` bundle.
- The web image uses Next.js standalone output.
- PostgreSQL 18 persists at `/var/lib/postgresql`, matching the official image’s versioned data-directory layout.
- PostgreSQL is no longer published to the host by Compose.
- Application containers run as non-root with read-only root filesystems.

Do not point the PostgreSQL 18 service at an older PostgreSQL major-version data directory. Perform a supported `pg_upgrade` or logical dump/restore when upgrading an existing external database.

## Rollback

Roll back application containers by immutable image tag. Do not automatically roll back a production database migration. Inspect the generated migration and create a reviewed down-migration or restore the verified backup if a database rollback is required. Because the list-response contract changed, roll back the API and web app together.

## Verification checklist

- `/api/health` returns `200`.
- Registration, verification, password sign-in, and Google sign-in (if enabled) work.
- Dashboard arrows load pages of at most eight items without duplicates.
- A malformed stored resume does not hide other dashboard entries.
- Saving resume 17 returns a toast while the current draft remains downloadable.
- AI provider calls time out even when the provider sends headers and stalls the body.
- Requests from two public client IPs do not unintentionally share a rate-limit partition in the deployed proxy topology.
