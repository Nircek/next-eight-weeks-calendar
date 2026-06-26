# `PROMPT.md`

## 1. GOAL

Create a static Progressive Web App (PWA) that generates **millimeter-accurate, printable weekly calendar grids** with live preview, configurable layout, and fully offline capability.

---

## 2. CAPABILITIES

* Dynamically render calendar pages based on user input with no manual triggers.
* Generate weekly grids using:
  * ISO week system
  * Epoch-based week numbering
  * Combined ISO + epoch labeling
* Support configurable:
  * Start ISO week (via HTML week input, or date input when week inputs are unsupported)
  * Epoch reference week (defines which week is epoch W1; week input with the same date fallback pattern as Start Week)
  * Total weeks
  * Weeks per page
  * Page size and margins (in mm), with paper-size presets (A4 default, US Letter, or custom dimensions)
  * Greyscale border levels for outer, vertical, and horizontal lines (separate sliders, white to black)
  * Each border slider shows a live color preview swatch and its current percentage value beside the control
* Compute and expose derived layout values:
  * Row height (based on weeks per page)
  * Cell width
* Display a live summary of the current calendar covering:
  * Cell dimensions (width × row height in mm)
  * Page count
  * Calendar date range (ISO 8601 `YYYY-MM-DD`, first Monday through last Sunday)
  * ISO week range (`YYYY-Www`, zero-padded week numbers)
  * Epoch week range (`W` + digits, no leading zeros on epoch numbers)
* Provide a scale-to-fit preview with manual zoom slider (10–100%) and a **Fit** button that re-enables auto-fit; preview scaling is screen-only and must not affect print output.
* Render multiple pages with correct pagination and no placeholder rows.
* Display:
  * Week labels in a compact column positioned outside the grid table
  * Day labels with a smaller `YYYY-MM-` prefix and a bolded zero-padded day number (`DD`)
  * Week labels with a smaller `YYYY-W` (or `W`) prefix and a prominent zero-padded ISO week number (`ww`)
  * ISO week labels on a single line (`white-space: nowrap`), auto-fitted to the week column width
  * Week labels right-aligned in the week column; day labels left-aligned in day cells
* Provide live visual feedback when border levels change.
* Position all cell text at the top of each cell, leaving the lower area free for handwritten notes.
* Include a per-page footer containing the application URL.
* Support printing via the browser print dialog (Ctrl+P / Cmd+P) with optimized layout; no in-app print button.
* Function fully offline after initial load.

---

## 3. INVARIANTS

* All layout dimensions must be **physically accurate in millimeters** when printed.
* Calendar structure must:
  * Represent exactly 7 days per week
  * Preserve correct chronological order without gaps or duplication
* All date calculations must:
  * Be performed strictly in UTC (`Date.UTC`, `getUTC*`, `setUTC*`) — timezone-independent and consistent across environments
  * When parsing values from date inputs (`YYYY-MM-DD`), parse the string directly as a UTC midnight timestamp (via `Date.UTC` in `parseUTCDateString`) — never `new Date("YYYY-MM-DD")` or other forms that apply local timezone offsets and can shift the calendar day
* Page size must:
  * Default to A4 (210×297 mm)
  * Offer preset dropdown for A4 and US Letter (215.9×279.4 mm); custom dimensions via manual width/height fields
* Generated week labels must:
  * Follow ISO week rules correctly (including ISO week-year)
  * Use ISO week-year (not calendar year of Monday) in `YYYY-W` labels; use calendar year in `YYYY-MM-` day labels
  * Format all displayed calendar dates as ISO 8601 `YYYY-MM-DD` with zero-padded month and day
  * Format ISO week numbers with a leading zero (`01`–`53`); epoch week numbers use no leading zeros
  * Ensure epoch weeks start at W1 for the configured epoch reference week and never produce zero or negative values
  * Epoch W1 is always the **Monday** of the ISO week containing the epoch reference (whether entered as a week or date)
* Pagination must:
  * Contain only actual data rows
  * Never include placeholder or empty rows
  * Keep row height and cell width identical on every page, including a partial last page
  * On a partial last page, end the grid above the bottom margin rather than stretching rows to fill the page
* Visual structure must:
  * Clearly distinguish outer boundaries from internal grid lines via separate configurable greyscale levels
  * Render the week-number column (fixed **16.8 mm** wide) smaller than day cells and **outside** the 7-day grid (not as an internal table column)
  * Apply borders only to the 7-day grid area — the week column carries **no borders**
* Text content must:
  * Fully fit within its allocated cell area via canvas-measured monospace auto-fitting (no iterative DOM resize loops)
  * Never overflow or be clipped
  * Be top-aligned within cells so the remaining cell area is available for handwriting
  * Render repetitive prefixes (`YYYY-MM-`, `YYYY-W`, `W`) smaller than the varying values they accompany (golden-ratio conjugate scaling: \((\sqrt{5}-1)/2 \times\) baseline)
  * Bold only the day number in day cells; prefix segments are not bolded
  * Render week numbers more prominently than their prefixes
  * Align week labels to the right within the week column
  * Align day labels to the left within day cells
* Layout rendering must remain:
  * Stable regardless of margin, border, or padding values
  * Use `box-sizing: border-box` globally
* Border appearance must:
  * Be controlled by greyscale level (white through grey to black), not by varying line thickness
  * Use sliders restricted to the white–grey–black range
  * Map slider values directly to greyscale intensity: **0 = white** (`rgb(255, 255, 255)`), **100 = black** (`rgb(0, 0, 0)`); higher values are darker, not lighter
  * Show a color preview swatch and percentage label next to each border slider; both must update immediately when the slider moves
  * Apply uniform **1 px** line thickness across outer, vertical, and horizontal borders
  * Render the outer border on the 7-day grid perimeter only (see §7 Border placement)
* Printed output must:
  * Match the on-screen layout in structure and proportions
  * Avoid unintended extra pages (e.g., trailing blanks)
* Application must:
  * Remain fully functional without network access after initial load
* If constraints conflict, preserve physical print accuracy and calendar correctness over visual fidelity.

---

## 4. ACCEPTANCE CRITERIA

* Any input change triggers immediate full re-render.
* Computed layout values match defined formulas (see §7 Layout formulas).
* Live summary updates immediately on any input change and reports cell size, page count, date range, ISO week range, and epoch week range.
* Preview scale-to-fit adjusts on render, window resize, and viewport resize (via `ResizeObserver`) when auto-fit is active; must work in Chrome and Firefox; print output is always at 100% scale (no transform).
* Printed output matches screen preview in structure and proportions.
* ISO week handling:
  * Correct week-year transitions
* Epoch week handling:
  * Starts at W1 for the configured epoch reference week
  * No invalid values (W0 or negative)
  * Epoch reference week is user-configurable (HTML week input, or date input fallback)
  * Epoch W1 = Monday of the ISO week containing the selected reference date/week
* Week/date inputs:
  * Detect `type="week"` support at runtime (`input.type !== 'text'` after setting `type="week"`)
  * Fall back to `type="date"` when unsupported; selected date maps to that date's ISO week Monday
  * Date strings from `type="date"` inputs parsed as UTC midnight (see §3 Invariants)
  * Week input defaults: current ISO week UTC (start), `1970-W01` (epoch)
  * Date fallback defaults: today (start), `1970-01-01` (epoch)
* If start week precedes epoch:
  * Start week input is corrected to the ISO week containing the epoch Monday
  * Rendering begins from the epoch Monday
  * Correction uses a value-comparison guard (`if (input.value !== clampedValue)`) to prevent infinite update loops
* Numeric inputs:
  * `0` is a valid margin/dimension value (never use `parseFloat(x) || default`)
* Pagination:
  * Correct number of pages
  * No empty rows rendered
  * Uniform row height and cell width across all pages
  * Partial last page leaves unused space above the bottom margin instead of enlarging cells
* Borders:
  * Three separate sliders control outer, vertical, and horizontal border greyscale
  * Slider range is **0 = white** to **100 = black** (not inverted); only greyscale colors are produced
  * At 100, border color must be black (`rgb(0, 0, 0)`); at 0, border color must be white (`rgb(255, 255, 255)`)
  * Each border slider displays a color preview swatch and percentage (e.g. `40%`) beside it; preview color must match the mapped greyscale value
  * Level changes are reflected immediately in the preview
  * Line thickness is uniform and does not change with border settings
  * Outer slider visibly controls the grid perimeter border color
  * Outer, vertical, and horizontal lines are visually distinct and correctly placed (see §7 Border placement)
  * No horizontal borders on week label cells
  * No vertical border on week label cells; Monday cell carries the outer left border at full row height
  * No outer border between consecutive rows (only inner horizontal separators)
* Text:
  * Fits within cells without overflow via canvas monospace measurement
  * Maintains hierarchy: smaller repetitive prefixes, bold day number, prominent week number
  * Is top-aligned in every cell
  * ISO labels stay on one line (`nowrap`); no line-break wrapping
* Week labels:
  * Rendered in a narrow column outside the grid table
  * Right-aligned within the week column
  * Prefix (`YYYY-W` or `W`) is smaller than the week number and shares a common baseline with the week number
* Day labels:
  * Left-aligned within day cells
  * `YYYY-MM-` prefix is smaller than the bolded day number
  * Day number is zero-padded (`01`–`31`)
* ISO week labels:
  * Week number portion is zero-padded to two digits (`01`–`53`)
* Epoch week labels:
  * Week number has no leading zeros
* Footer:
  * Present on every page
  * Positioned below last visible row on that page (within bottom margin)
  * Visible in both screen and print
* Offline:
  * App loads and works without network after first visit (service worker, stale-while-revalidate with versioned cache)
* Print mode:
  * Control UI hidden
  * No in-app print button; printing works via browser shortcut (Ctrl+P / Cmd+P)
  * No extra blank page generated (`break-after: page` only on non-final pages)
  * `@page { margin: 0mm; }`

---

## 5. ASSUMPTIONS

* Default page size corresponds to A4 (210×297 mm); US Letter available as a preset.
* Default control values: 8 total weeks, 8 weeks per page, 10 mm margins (all sides), 50% border sliders, `iso+epoch` label mode.
* Users rely on browser-native print functionality and keyboard shortcuts.
* Monospace rendering is sufficiently consistent across environments (`font-family: monospace`).
* `type="week"` is not available in all browsers (e.g. Safari); the app falls back to `type="date"` after runtime feature detection.
* Preview scale measurement may require mm-to-px fallbacks when browsers report zero layout dimensions for mm-sized elements (notably Firefox).
* Combined ISO + epoch labels are expected to fit within row height in typical usage; if not, log `console.error` and render anyway.
* Greyscale border levels provide sufficient contrast for print in typical usage.
* Repetitive date/week prefixes within a calendar rarely change and may be rendered smaller to conserve space.
* Visual fidelity may degrade slightly if constraints are pushed beyond typical ranges.

---

## 6. EXCLUDED DETAILS

* Accessibility enhancements beyond standard HTML behavior.
* Localization or internationalization.
* Deployment strategy.
* Performance optimizations beyond correctness.

---

## 7. IMPLEMENTATION DECISIONS

Decisions made during the initial build. These resolve ambiguities in earlier drafts of this document.

### Technology

* **Stack:** HTML, vanilla JavaScript, pure CSS — no frameworks or build step.
* **DOM structure:** semantic `<div>` elements with CSS Grid — HTML `<table>` elements are forbidden.
* **PWA:** `manifest.json`, `icon.svg`, service worker with stale-while-revalidate strategy and explicit cache-version bumping (`CACHE_VERSION` in `sw.js`) to ensure offline capability without trapping users on stale versions.
* **Control panel:** fixed left sidebar (~300 px) with opaque background; four grouped sections (dates & labels, week counts, page dimensions, border colors); stacked field labels; 2-column grids for related pairs; no print/submit buttons. Preview area occupies the remaining width with a summary bar and scale controls above the page preview. Sidebar collapses above preview on narrow screens (<900 px).
* **App shell:** CSS Grid with sidebar + preview column; `height: 100vh` on `.app-shell`; `min-height: 0` on flex descendants (`.preview-area`, `#preview-viewport`) so the preview viewport receives a computable height in all browsers.
* **Preview DOM:** `#preview-viewport` → `#pages-scaler` → `#pages-inner` → `#pages` → `.print-page` elements. Scaling transforms apply to `#pages-inner` only — never to `#pages` (flex container) or `.print-page`.

### Epoch reference input

* **Chosen:** week input when the browser supports `type="week"`, with `type="date"` fallback when unsupported (same pattern as Start Week).
* Epoch W1 is always anchored to the **Monday** of the ISO week containing the reference, not the raw calendar date.
* Default: `1970-W01` (week input) or `1970-01-01` (date fallback).

### ISO and date formatting

* Calendar day labels use ISO 8601 `YYYY-MM-DD` with zero-padded month and day (`formatISODateParts`, `formatISODate`).
* ISO week labels use zero-padded week numbers (`01`–`53`) in the bold number segment (`formatISOWeekParts`).
* Epoch week labels use plain digits with no leading zeros.
* Date input parsing uses `parseUTCDateString` → `Date.UTC(year, month − 1, day)`; never locale-dependent `Date` parsing.

### Paper size presets

* Dropdown: **A4** (210×297 mm, default), **US Letter** (215.9×279.4 mm), **Custom** (manual width/height).
* Selecting a preset fills width/height fields; editing dimensions manually switches preset to Custom.
* All sizes in millimeters for print accuracy.

### Live summary

* Rendered in the preview header above the page preview.
* Format: `Cell W × H mm · N page(s) · YYYY-MM-DD – YYYY-MM-DD · ISO YYYY-Www – … · Epoch Wn – Wm`
* ISO week range omits repeated year when both weeks share the same ISO week-year (e.g. `2026-W26 – W33`).
* Updates on every input change alongside the calendar re-render.

### Preview scale

* **Auto-fit (default):** scale preview to fit available viewport width and height (based on first page dimensions) after each render, on window resize, and when `#preview-viewport` resizes (`ResizeObserver`).
* **Manual zoom:** 10–100% slider; moving the slider disables auto-fit until **Fit** is clicked.
* **Scale algorithm:** `scale = min(1, availableWidth / pageWidth, availableHeight / pageHeight)`; available size derived from `#preview-viewport` using `max(clientWidth, getBoundingClientRect().width)` (and height likewise) minus padding.
* **Measurement:** reset all inline scale styles on `#pages-inner` and `#pages-scaler` before measuring; read natural page size from first `.print-page` via `offsetWidth`/`offsetHeight`, falling back to `getBoundingClientRect()`, then to `mmToPx()` from configured page dimensions when a browser reports zero (Firefox with mm-sized elements).
* **Apply scale:** set `#pages-inner` width to natural width and `transform: scale(s)` with `transform-origin: top left`; set `#pages-scaler` to scaled width and height with `overflow: hidden` so layout space matches visual size.
* **Scheduling:** double `requestAnimationFrame` after render; retry via single `requestAnimationFrame` if viewport or page dimensions are not yet available.
* **Print:** hide preview header; reset `#pages-inner` transform and explicit dimensions; pages render at full mm size.

### Service worker

* Cache name includes version suffix (`weekly-calendar-v{N}`); bump `CACHE_VERSION` on deploy.
* **Stale-while-revalidate:** return cached response immediately when available; revalidate in background via `fetch` + `cache.put`; serve network when no cache (offline falls back to cache only when cached entry exists).
* Install: precache all app assets; activate: delete older cache versions.

### ISO label sizing

* **Chosen:** `white-space: nowrap` plus canvas-based monospace auto-fitting — **not** line-break wrapping.
* Labels are measured at a 10 px base using benchmark strings (`9999-W` + `53`, `2026-12-` + `31`, `W` + `2934`), then scaled to fill the target column width.
* Small-text prefixes scale at the golden-ratio conjugate relative to the baseline size.

### Layout formulas

| Value | Formula |
|-------|---------|
| Row height | `(page height − top margin − bottom margin) / weeks per page` |
| Week column width | fixed **16.8 mm** |
| Cell width | `(page width − left margin − right margin − 16.8) / 7` |

All dimensions injected as CSS custom properties in `mm` units. Page margins applied as padding on `.print-page`.

### Border placement

Outer borders apply to the **7-day grid perimeter only**. The week-number column is outside this perimeter and carries no borders.

| Location | Border |
|----------|--------|
| First row of each page — top of `.day-grid` | outer top |
| Monday cell (column 1) — left edge | outer left |
| Columns 1–6 — right edge | vertical (inner) |
| Sunday (column 7) — right edge | outer right |
| All rows except the final data row — bottom of day cells | horizontal (inner) |
| Final data row globally — bottom of day cells | outer bottom |
| Week label cells | **none** |

Row separators between consecutive weeks use only the inner horizontal border on day cells. The outer top border is applied once per page (first row), not between every row.

### ISO Monday resolution

Use the January 4th anchor method in UTC: January 4th of the ISO year always falls in week 1; derive that week's Monday, then add `(weekNumber − 1) × 7` days.

### Week label modes

* `iso` — ISO label only (`YYYY-W` small prefix + bold zero-padded week number)
* `epoch` — epoch label only (`W` normal prefix + bold digits, no leading zeros)
* `iso+epoch` — ISO line first, epoch line directly below; each at its own dynamic font size

### Print

* Hide control panel and preview header in `@media print`.
* Reset `#pages-inner` and `#pages-scaler` inline dimensions/transform for print (pages render at full mm size).
* Page breaks between sheets via `.print-page:not(:last-child) { break-after: page; }`.
* Per-page footer shows `window.location.href` at low opacity below the last visible row.
