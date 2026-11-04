# Styling audit

Audit date: 4 November 2026

Scope: `web/src` only. `api` and `tests` were not inspected or changed. Counts describe the current working tree, including the existing uncommitted AI-result work.

## Baseline

- Tailwind CSS is **v4.3.3** (`tailwindcss` and `@tailwindcss/turbopack`). The app correctly enters Tailwind through `@import 'tailwindcss'` and already exposes shadcn variables with `@theme inline` in `src/app/globals.css`; there is no v3 config file.
- shadcn-style primitives already exist for `Button`, `Card`, `Field`, `Input`, `Label`, `Separator`, and `Toast`. `class-variance-authority` is installed and used by `Button`.
- `src/lib/utils.ts` already exports `cn` from the `cn` package. That package is explicitly a compiled `clsx` + Tailwind-merge replacement, so adding separate `clsx` and `tailwind-merge` packages would duplicate existing functionality.
- Dark variables exist under `.dark`, but no component applies `.dark`, no `data-theme` path exists, and there is no `prefers-color-scheme` fallback. The current product pages also override the semantic variables with raw light colours.
- PDF export is currently self-contained: `src/lib/pdf/preview-html.ts` clones `.resume-document`, extracts matching `.resume-*` CSS rules from the live CSSOM, embeds EB Garamond as a data URL, and inserts print resets and `@page` rules.

## 1. Inline style audit

There are **4 `style={{ ... }}` usages** and **1 indirect `style={style}` usage**. All five are legitimately runtime-dependent; there are **0 static inline styles** to convert directly to classes.

| File | Count | Classification |
| --- | ---: | --- |
| `src/components/editor/resume-editor.tsx` | 1 | Runtime divider position: dynamic `gridTemplateColumns` from `editorShare`. |
| `src/components/editor/preview/resume-preview.tsx` | 3 | Runtime paper dimensions and measured scale: `maxWidth`, stage `height`, paper `width`/`minHeight`, and `transform`. |
| `src/components/editor/preview/layouts.tsx` | 1 | Runtime resume CSS variables for user-selected accent, text, font, and margins. |

The preview values should remain runtime styles, but Phase 5 should move their construction into one typed theme function. The paper wrapper already uses `scaledHeight`, so transform scaling does not currently create unscaled phantom vertical space.

## 2. Arbitrary Tailwind values and hardcoded colours

### Arbitrary Tailwind values

The TSX AST contains **717 arbitrary value utility occurrences**, representing **354 distinct utilities across 36 files**. A further **37 arbitrary selector/attribute variants** occur in 7 files; those are Tailwind composition syntax rather than design values and are tracked separately.

| File | Arbitrary values |
| --- | ---: |
| `src/components/landing/landing-sections.tsx` | 150 |
| `src/components/landing/editor-illustration.tsx` | 91 |
| `src/components/editor/ai-tailor-dialog.tsx` | 80 |
| `src/components/start/start-visual.tsx` | 51 |
| `src/lib/ai/ai-settings.tsx` | 41 |
| `src/components/auth/login-form.tsx` | 28 |
| `src/app/dashboard/page.tsx` | 27 |
| `src/components/start/template-options.tsx` | 27 |
| `src/components/auth/signup-form.tsx` | 24 |
| `src/components/editor/preview/preview-toolbar.tsx` | 21 |
| `src/components/start/import-pdf-dialog.tsx` | 20 |
| `src/app/start/page.tsx` | 18 |
| `src/components/start/start-page-shell.tsx` | 18 |
| `src/components/ui/toast.tsx` | 14 |
| `src/components/start/pdf-upload.tsx` | 10 |
| `src/components/editor/editor-section.tsx` | 9 |
| `src/components/landing/landing-primitives.tsx` | 9 |
| `src/components/resumade-logo.tsx` | 9 |
| `src/components/Header.tsx` | 8 |
| `src/components/editor/item-list.tsx` | 7 |
| `src/components/start/start-choices.tsx` | 7 |
| `src/app/(auth)/layout.tsx` | 6 |
| `src/components/dashboard/dashboard-toolbar.tsx` | 6 |
| `src/components/editor/editor-fields.tsx` | 4 |
| `src/components/editor/preview/resume-preview.tsx` | 4 |
| `src/components/editor/use-preview-divider.tsx` | 4 |
| `src/components/ui/card.tsx` | 4 |
| `src/app/(editor)/editor/page.tsx` | 3 |
| `src/components/editor/editor-toolbar.tsx` | 3 |
| `src/components/editor/resume-editor.tsx` | 3 |
| `src/components/editor/sortable-list.tsx` | 3 |
| `src/app/page.tsx` | 2 |
| `src/app/start/templates/page.tsx` | 2 |
| `src/components/editor/rich-text-editor.tsx` | 2 |
| `src/app/(auth)/signin/page.tsx` | 1 |
| `src/app/(auth)/signup/page.tsx` | 1 |

Breakdown of the main design-value categories:

- 382 colour-bearing arbitrary utility occurrences (159 distinct state-qualified utilities).
- 124 arbitrary spacing/dimension occurrences (92 distinct utilities). Many landing illustration dimensions and responsive clamps are genuine one-offs; common component dimensions are token candidates.
- 56 arbitrary font-size occurrences (24 distinct utilities).
- 43 arbitrary tracking occurrences (13 distinct utilities).
- 26 arbitrary shadow occurrences (19 distinct recipes).
- 8 custom-radius occurrences (5 values: 9, 10, 14, 24, and 28px), alongside the regular Tailwind radius scale.
- One calculated toast z-index plus ordinary `z-10` and `z-50` layers.

### Hardcoded colours

Across TS, TSX, and CSS there are **454 hardcoded hex/rgb/hsl occurrences**, comprising **157 distinct literal values in 36 files**. This includes the two user-default resume colours and the classic blue link colour, which belong to the isolated resume theme rather than the application chrome.

| File | Occurrences |
| --- | ---: |
| `src/components/editor/ai-tailor-dialog.tsx` | 67 |
| `src/lib/ai/ai-settings.tsx` | 38 |
| `src/components/landing/landing-sections.tsx` | 35 |
| `src/components/landing/editor-illustration.tsx` | 31 |
| `src/components/auth/login-form.tsx` | 29 |
| `src/components/auth/signup-form.tsx` | 24 |
| `src/app/dashboard/page.tsx` | 22 |
| `src/components/editor/preview/preview-toolbar.tsx` | 21 |
| `src/components/start/pdf-upload.tsx` | 19 |
| `src/components/start/start-visual.tsx` | 19 |
| `src/components/start/template-options.tsx` | 19 |
| `src/components/editor/editor-styles.ts` | 13 |
| `src/components/start/import-pdf-dialog.tsx` | 12 |
| `src/components/start/start-choices.tsx` | 12 |
| `src/components/Header.tsx` | 10 |
| `src/components/editor/item-list.tsx` | 7 |
| `src/components/start/start-page-shell.tsx` | 7 |
| `src/components/dashboard/dashboard-toolbar.tsx` | 6 |
| `src/components/editor/editor-section.tsx` | 6 |
| `src/components/editor/rich-text-editor.tsx` | 6 |
| `src/app/start/page.tsx` | 5 |
| `src/components/landing/landing-primitives.tsx` | 5 |
| `src/components/resumade-logo.tsx` | 5 |
| `src/components/editor/editor-fields.tsx` | 4 |
| `src/components/editor/preview/resume-preview.tsx` | 4 |
| `src/components/editor/use-preview-divider.tsx` | 4 |
| `src/app/(editor)/editor/page.tsx` | 3 |
| `src/app/globals.css` | 3 |
| `src/components/editor/editor-toolbar.tsx` | 3 |
| `src/components/editor/resume-editor.tsx` | 3 |
| `src/components/editor/sortable-list.tsx` | 3 |
| `src/app/(auth)/layout.tsx` | 2 |
| `src/app/page.tsx` | 2 |
| `src/components/editor/preview/constants.ts` | 2 |
| `src/components/editor/preview/resume-preview.css` | 2 |
| `src/app/start/templates/page.tsx` | 1 |

## 3. Repeated class-string patterns

An eight-token sliding-window scan found two concrete patterns repeated in at least three places:

1. **Dialog shell** in `src/components/editor/ai-tailor-dialog.tsx`, `src/components/start/import-pdf-dialog.tsx`, and `src/lib/ai/ai-settings.tsx`: 24px radius, the same border/surface/foreground, large modal shadow, dark backdrop, and backdrop blur. Width and inner scrolling differ by dialog.
2. **Dialog close icon button** in the same three files: the same 36px grid button, border, muted colour, and hover treatment.

These should become a shared dialog shell and `IconButton`. The auth input classes are also duplicated between sign-in and sign-up, but only across two files; they should still converge on the existing `Input` primitive during normal migration. Existing `editorInputClass`, `editorOutlineButtonClass`, `accountButtonClass`, `cardClassName`, and landing action constants are local attempts at reuse that can be replaced by typed primitive variants.

## 4. Token inconsistencies

- **Colour:** product chrome uses many near-duplicate greys and blues while the existing neutral shadcn variables are mostly bypassed. Repeated roles are identifiable: canvas `#faf9f6`, primary foreground `#1e2636`/`#273348`, muted text `#566173`/`#687282`/`#8a94a5`, borders around `#d7deea`–`#e5eaf2`, accent `#3558c8`, accent hover `#2847a9`, and status palettes.
- **Spacing/dimensions:** 92 distinct arbitrary spacing/dimension utilities mix real layout constraints (paper, responsive art, modal viewport calculations) with repeated shell widths and header heights. Preserve the former; tokenise the latter.
- **Radius:** regular `rounded-lg`, `rounded-xl`, and `rounded-2xl` coexist with 9, 10, 14, 24, and 28px values. Modal, control, card, and feature-art radii need named roles.
- **Shadow:** 19 custom recipes encode control, card, elevated card, modal, accent button, preview paper, and illustration roles. Several differ only by alpha.
- **Typography:** 24 arbitrary font sizes and 13 letter-spacing values recur. Hero clamps are responsive display styles; eyebrow, dialog title, card title, microcopy, and document-shell text should use named utilities/tokens.
- **Z-index:** application layers currently use `z-10`, `z-50`, and a calculated toast stack near 1000. These are coherent but implicit; name the header/dialog/toast layer policy.

## 5. CSS duplication, dead code, and global conflicts

- No duplicate exact CSS selectors were found, and the named selectors in both CSS files are referenced.
- `src/app/globals.css` contains a one-off `.ai-dialog-scroll` implementation while the AI tailor dialog hides scrollbars and the import dialog uses browser defaults. This is duplicated behaviour expressed three different ways and should become `.scroll-area`.
- The existing shadcn semantic variable system and raw product colours form two competing styling systems. `body` uses semantic `bg-background text-foreground`, then nearly every route overrides it with raw light colours.
- The `.dark` palette is effectively dead because no theme activation path exists. It also would not affect most raw-colour components.
- `src/components/editor/preview/resume-preview.css` mixes resume-document rules with editor shell/grid/divider and print-only editor hiding. Split app layout concerns from embeddable resume CSS.
- The `@media (max-width: 1023px)` rule applies `grid-template-columns: ... !important` to defeat the editor's inline grid columns. It is necessary with the current structure but is a CSS/inline-style conflict to remove when the shell is refactored.
- `@page` size/margin construction is duplicated between `resume-preview.tsx` and `preview-html.ts`; runtime resume CSS variables are separately assembled in `layouts.tsx`. This is the main preview/PDF drift risk.
- `preview-html.ts` discovers styles by scanning every live stylesheet for selectors containing `.resume-`. It works today and embeds fonts correctly, but couples export correctness to browser CSSOM contents and selector naming rather than a typed source.
- `resume-editor.tsx` contains an empty `<div className="space-y-2" />` after the toolbar.
- The universal `* { @apply border-border outline-ring/50; }` is standard shadcn base CSS, not currently broken, but it should remain limited to defaults and not become a substitute for explicit component focus styles.

## 6. Editor layout and scroll audit

At desktop width, the route does **not** meet the requested ownership model:

- The root layout always renders the 72px sticky header.
- The editor route wrapper is `h-dvh`, so header plus route height exceeds the viewport before editor padding/content is considered.
- `resume-editor-workspace` is a content-height grid with vertical padding. The form pane has no bounded height or overflow, so the **window/document scrolls** for normal resumes.
- `ResumePreview` is sticky with `lg:max-h-[calc(100dvh-6rem)] lg:overflow-auto`, producing the second scroll container.
- `PreviewToolbar` is inside that scrolling section, so it scrolls with the paper instead of remaining outside the paper scroller.
- Therefore the steady-state desktop route has two scroll owners, but they are the wrong two: **window + preview**, rather than **editor pane + preview paper pane**. The document element can exceed `innerHeight`.
- When an AI/settings/import dialog is open, it introduces its own modal scroller while body scrolling is locked; that is appropriate transient modal behaviour and should use the shared scroll utility.
- Below `lg`, the current CSS collapses the editor grid to one column and uses normal page scrolling. That is an acceptable fallback to preserve unless an Edit/Preview tab switch is deliberately introduced.

## Proposed implementation plan

Each logical phase will be kept in its own commit and followed by lint, strict TypeScript, and production build verification.

1. **Tokens and scrollbar foundation** — replace the placeholder neutral variables with semantic roles matching the current light UI, add corresponding dark values through both `.dark`/`data-theme` and `prefers-color-scheme`, expose roles through Tailwind v4 `@theme inline`, define radius/shadow/type/layer roles, and add `.scroll-area`. Keep resume-document colours isolated.
2. **Primitive consolidation** — retain and extend the existing shadcn-style primitives instead of duplicating them. Add only primitives that have real call sites (`IconButton`, `Textarea`, `Select`, `Panel`, dialog shell, and `ScrollArea`); reuse existing `Button`, `Card`, `Input`, `Label`, and `cn`. Migrate the three dialogs and repeated auth/editor controls first.
3. **Application style migration** — replace raw product colours, repeated shadows/radii/type styles, and component-level class constants with semantic utilities and variants. Preserve genuine landing-art geometry and responsive display clamps with documented one-off classes.
4. **Editor shell and scrolling** — give the editor route a viewport-bounded shell below the header (or an editor-specific route layout), make the toolbar non-scrolling, bound the two-column main area with `min-h-0`, put `.scroll-area` on the editor pane and preview paper pane, move `PreviewToolbar` outside the preview scroller, and retain normal document scroll below `lg`.
5. **Single-source resume theme and export** — create a typed resume-theme module that owns paper data, margins, font selection, user colours, runtime CSS variables, and the embeddable resume CSS. Use the same output for React preview and `createPreviewHtml`; retain data-URL font embedding and self-contained exported HTML. Remove CSSOM selector discovery after parity is verified.
6. **Documentation and visual verification** — add `docs/styling.md`, record justified runtime inline styles and one-offs, capture before/after counts, verify landing/start/editor/dashboard/auth at 1440px and 390px in light/dark modes, compare preview with a generated PDF, and assert on desktop that `document.documentElement.scrollHeight <= innerHeight` with exactly the two intended pane scrollers.

## Working-tree note

The repository already contains uncommitted AI-result feature changes, plus editor page formatting/layout edits, before this audit document was added. Styling commits must stage only their own files/hunks or first separate that work into an independently reviewed commit; it must not be swept into a styling commit.
