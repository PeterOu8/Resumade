# Resume document storage

Resume uploads are stored through `Services/Interfaces/IFileStorage` in the single API project. The `Infrastructure/FileStorage/LocalFileStorage` implementation writes to a configurable root outside the repository by default (`%LOCALAPPDATA%/Resumade/uploads` on Windows or the platform equivalent).

Configure a different root with:

```json
{
  "FileStorage": {
    "RootPath": ""
  }
}
```

The database stores only document metadata and a generated relative storage key. Physical filenames are random GUIDs with a validated `.pdf` or `.docx` extension; the uploaded original filename is metadata only.

Each resume has one current source document. A replacement stores the new file and metadata, then removes the prior physical file. If cleanup fails, metadata remains authoritative and the orphan can be handled by a later cleanup job.

The upload boundary validates non-empty files, a 10 MB maximum, supported extensions, and expected MIME types. MIME type and extension validation are not malware scanning or deep document inspection; those controls belong to later production hardening.

The current endpoint is `POST /api/resumes/{resumeId}/document` using `multipart/form-data` with a `file` field. Ownership is derived from the authenticated user through the parent resume.
