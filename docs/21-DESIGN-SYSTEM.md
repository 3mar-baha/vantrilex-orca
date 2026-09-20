# 21 — Design System — Vantrilex Agentic Workbench & Launcher

## Purpose

Visual tokens for the showcase builder and any owner-facing surface.
The Orca ADE itself is never restyled; these tokens govern Vantrilex
additions only.

## Status

Frozen for Step 6. `pnpm run check:code-quality:changed` and
`pnpm run lint:design-system` gate every renderer touch.

## Schema

### Tokens (DESIGN.md)

| Token | Value | Role |
|---|---|---|
| Canvas (warm cream) | `#faf9f5` | Showcase background |
| Coral | `#cc785c` | Primary accent, calls to action |
| Ink | `#141413` | Body text on light surfaces |
| Dark | `#181715` | Dark surfaces, terminal-adjacent panels |
| Serif Display | System serif stack | Headlines, showcase titles |
| Rhythm | 96px section rhythm | Vertical spacing cadence |

### Rules

- Warm-cream/coral/ink only on Vantrilex surfaces. Strict ban on
  cyber-cyan or any neon restyle of Orca chrome.
- shadcn primitives in `src/renderer/src/components/ui/` are used
  as-is; no per-file restyles of a primitive (lint fails it).
- No computed `className` strings; no raw palette colors outside the
  token set (`main.css` is canonical).
- Typography: system stack for UI, serif display for showcase
  headlines, tabular numerals for budgets and metrics.

### Enforcement

`STYLEGUIDE.md` is the day-to-day authority; this file freezes the
showcase-facing subset. When STYLEGUIDE.md is silent, follow its final
section's resolution order. Unlisted tokens require a decision entry
before use.
