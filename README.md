# Resumade

Resumade is a web app for building and revising resumes. Start from a template or import an existing PDF, edit each section alongside a live preview, and download a PDF with selectable text.

**[Open the live frontend](https://resumade-zeta.vercel.app)** · [Explore the screenshots](docs/screenshots.md) · [Run it locally](docs/development.md)

![Resumade landing page with an illustration of the editor and live resume preview](docs/screenshots/landing.png)

## What you can do

- **Start with a template or an existing PDF.** Choose Classic, Modern, or Custom, or import a PDF with selectable text and review the extracted fields.
- **Use AI on your terms.** Connect OpenAI, Claude, Grok, Gemini, or DeepSeek, opt in to AI-assisted PDF parsing, and tailor a draft to a job description with selective before/after approval.
- **Edit with a live preview.** Reorder sections and entries by dragging, format descriptions with rich text, and adjust the paper size, colours, and margins.
- **Download your current draft.** Guests and signed-in users can export a PDF using the preview’s layout and styling.
- **Save resumes to an account.** Sign in to open and manage saved resumes from the dashboard.

![Resume editor showing Alex Morgan's sample profile and summary alongside a Modern resume preview](docs/screenshots/editor.png)

[See the page gallery](docs/screenshots.md) for the start flow, templates, account pages, and dashboard. Screenshots use fictional resume data.

## Architecture and engineering

| Part | Stack |
| --- | --- |
| [Web app](web/) | Next.js, React, TypeScript, Tailwind CSS, and Auth.js |
| [API](api/) | ASP.NET Core 10, EF Core, PostgreSQL, and JWT bearer authentication |
| PDF workflow | PDF.js extracts text in the browser. The API parses it and uses PuppeteerSharp with Chromium to export the styled preview. |
| [API tests](tests/Resumade.Api.Tests/) | xUnit tests for health, CORS, rate limiting, AI response validation, and guest PDF export |

- **Guest editing and account storage.** Guests can edit a draft and request a PDF export. Auth.js manages web sessions, and the API validates JWTs for access to resumes stored in PostgreSQL.
- **PDF import and export.** The browser extracts text and layout metadata from uploaded PDFs. The API turns those items into editable sections and renders exports in sandboxed Chromium with scripts and external requests blocked.
- **Continuous integration.** Separate GitHub Actions workflows run frontend linting, type checks, and a production build, plus a Release build and the backend test suite. Each PR reports both checks and runs validation for the parts it changes.

[Development and CI guide](docs/development.md) · [API reference](docs/api.md)
