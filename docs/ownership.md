# User-owned resource authorization

User-owned resources derive ownership from the authenticated identity, never from a client-supplied `UserId`.

The API's `Infrastructure/Authentication/HttpCurrentUser` adapter is the only HTTP-aware component in this flow. It reads the validated JWT subject and exposes it through `Services/Interfaces/ICurrentUser`. Services query and mutate resources using that user ID. Request contracts intentionally omit ownership fields.

For profiles, `GET /api/profile` returns `404 Not Found` until the authenticated user creates a profile. `PUT /api/profile` then creates or replaces that user's profile information. Query-string or extra JSON `UserId` values have no effect.

This pattern is the default for future resumes, jobs, applications, interviews, documents, notifications, and RAG metadata. Each repository query must include the current user's ID; knowing another resource ID must never grant access.
