# Migration guide

This guide describes the database requirements, client compatibility, and release checks for the current application.

## Before deployment

1. Back up PostgreSQL and verify that the backup can be restored.
2. Deploy the web app and API as one release because the resume-list response contract changed.
3. Configure the required secrets: database connection/password, `Jwt__Key`, and `AUTH_SECRET`.
4. If transactional email or Google sign-in is enabled, configure those provider credentials before testing account flows.
5. Apply migrations through `20261106090000_AddResumePresentation` using the supplied migration bundle or the pinned local EF tool from the `api` directory.

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

## Presentation compatibility

`AddResumePresentation` adds the nullable `PresentationJson` column to `Resumes`. Existing resume content and account data are retained. Deploy the migration before running an API version that queries this column.

The web app sends a versioned `presentation` object alongside `title` and `content`. This preserves the selected template, section order, paper, margins, colours, and custom typography. Older clients can omit presentation; updates preserve stored settings. The web app supplies defaults when opening older records without presentation data.

Local recovery snapshots retain their existing storage prefix and are scoped by account and workspace. They remain device-local and do not require a database migration.

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
- A saved resume reopens with the same template, section order, and page settings.
- A guest draft continues after sign-in, and a pending account save completes.
- Local recovery offers explicit version choices and retains a dismissed copy for 24 hours.
- The header remains visible when navigating from the editor to the homepage or templates.
- Saving resume 17 returns a toast while the current draft remains downloadable.
- AI provider calls time out even when the provider sends headers and stalls the body.
- Requests from two public client IPs do not unintentionally share a rate-limit partition in the deployed proxy topology.
