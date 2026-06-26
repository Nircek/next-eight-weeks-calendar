# Weekly Calendar

A small web app that creates **printable weekly calendar sheets** you can fill in by hand. Pick a start week, choose how many weeks you need, adjust the page layout, and print — the grid on paper matches what you see on screen, down to the millimeter.

Works in the browser, installs like an app, and keeps working offline after the first visit.

## Screenshot

<img width="1512" height="982" alt="screenshot" src="https://github.com/user-attachments/assets/df86aa57-cfc6-4e1a-bb39-3104c0b0f6a9" />


---

## What it does (in plain terms)

Imagine a paper planner spread across several weeks: each row is one week, each column is a day (Monday through Sunday). Dates and week numbers appear in every cell, with plenty of blank space below for notes.

You can:

- **Choose when the calendar starts** — any ISO week, or a custom “epoch” week numbering scheme (W1, W2, …) anchored to a date you pick
- **Set how many weeks** to include and **how many fit on each printed page**
- **Pick paper size** — A4 (default), US Letter, or custom dimensions
- **Adjust margins and border colours** — three sliders control the outer frame, vertical dividers, and horizontal lines between weeks
- **Preview before printing** — zoom or fit-to-screen; printing uses Cmd+P / Ctrl+P like any web page

The app updates instantly as you change settings. No “Generate” button — the calendar is always live.

---

## How this project was built

This repository is a **spec-driven, AI-assisted build experiment** — useful as a portfolio piece showing how a detailed requirements document translates into working software through iteration and comparison.

### 1. The specification

Everything starts from a single source of truth: **[PROMPT.md](PROMPT.md)** — a ~300-line specification covering goals, behaviour, layout rules, print accuracy, date/week logic, and acceptance criteria. It reads like a product brief written for an engineer: what the app must do, what it must never do, and how ambiguous cases should be resolved.

The spec lives on the `main` branch. Implementations live on separate branches.

### 2. Multiple attempts from the same prompt

The [PROMPT.md](PROMPT.md) was given independently to AI coding agents to produce full implementations. Each attempt is a complete app on its own branch:

| Branch | Notes |
|--------|--------|
| `attempt1` | First implementation pass |
| `attempt2` | Second independent pass |
| `attempt3` | Third pass, focused on mm-accurate print layout |
| `attempt4` | Strong ES-module architecture, polished UI, CSS-class borders |
| `attempt5` | Modular preview scaling, separate label-building helpers |
| **`attempt6`** | **Merged “best of”** — see below |

Early attempts explored the problem space. Later ones converged on the full spec (ISO weeks, epoch numbering, offline PWA, print rules, live preview).

### 3. Comparing and merging (attempt6)

`attempt4` and `attempt5` were the strongest complete implementations. Rather than picking one wholesale, they were **analysed side by side** against [PROMPT.md](PROMPT.md):

- **From attempt4:** module structure, control-panel design, border styling, footer placement, paper-size presets, spec-aligned preview scaling
- **From attempt5:** extracted preview-scale module, more robust screen measurement, print-time scale reset, label builders, service-worker improvements
- **New in attempt6:** prefix/number baseline alignment, zoom display fix when auto-fit goes below 10%

The result on **`attempt6`** is the recommended version to run and demo.

### 4. What’s under the hood (briefly)

Plain HTML, CSS, and JavaScript — no frameworks, no build step. A service worker caches assets for offline use. Date and week calculations run in UTC so calendars stay consistent regardless of timezone.

If you care about the full technical contract (layout formulas, border placement, ISO week rules, PWA caching strategy), see **[PROMPT.md](PROMPT.md)**.
