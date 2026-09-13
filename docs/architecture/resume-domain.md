# Resume domain

## Resume and version boundaries

`Resume` is the stable, user-owned record used for naming and navigation. `ResumeVersion` is a structured content snapshot. Separating them allows tailoring to create version 2 or later without overwriting the imported or manually entered source facts in version 1.

Creating a resume currently creates an empty `Manual` version 1. This supports manual creation now and gives the later import workflow a predictable aggregate to populate. The current version is the highest version number; a separate `CurrentVersionId` is intentionally omitted until the product needs users to select a non-latest version.

Experiences, education entries, projects, and skills belong to a resume version rather than a user or resume directly. They are never global shared records. Narrative descriptions remain bounded text in this milestone; ordered achievement bullets and project technologies can be introduced when parsing/editing requirements establish their exact shape.

## Ownership and disclosure

`Resume.UserId` is derived from `ICurrentUser`. API requests contain no authoritative user ID. Repository reads combine `Resume.Id` and the authenticated user's ID in one query. An inaccessible resume returns `404`, regardless of whether it exists, to avoid leaking another user's resource identifiers.

Versions and children inherit ownership through their parent relationships; redundant user IDs are not stored on those rows.

## Dates

Employment, education, and project dates use the `YearMonth` value object because resumes normally state month/year rather than a specific day. PostgreSQL stores it as a sortable `YYYYMM` integer. Audit timestamps continue to use `DateTimeOffset`.

## Constraints and deletion

PostgreSQL uniquely constrains `(ResumeId, VersionNumber)` and checks positive version numbers, non-negative sort orders, valid date ordering, and non-negative experience years. Child foreign keys are indexed for aggregate loading.

Deletion cascades intentionally follow the ownership hierarchy:

```text
User -> Resume -> ResumeVersion -> Experience/Education/Project/Skill
```

Deleting a resume therefore removes only content exclusively owned by that aggregate. No cascade points upward or across aggregates.
