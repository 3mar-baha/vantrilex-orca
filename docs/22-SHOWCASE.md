# 22 — Showcase — Vantrilex Agentic Workbench & Launcher

## Purpose

Specification for the AI-generated `docs/showcase.html` visual project
dashboard: a plain-language window into project state for
non-technical stakeholders.

## Status

Specified for Step 6. Built by the `project-showcase-builder` skill;
no hand-written markup.

## Schema

### Content contract

| Section | Source of truth | Refresh |
|---|---|---|
| North star + principles | `docs/VISION.md` (generated) | Per provision |
| Milestones | `docs/08-ROADMAP.md` in this suite | Per milestone close |
| Open owner actions | `OWNER_ACTION_REQUIRED.md` (generated) | Per session |
| Health (tests, budgets) | Latest workflow log + voice latency log | Per run |

### Visual contract

Strictly `docs/21-DESIGN-SYSTEM.md` tokens: warm-cream `#faf9f5`
canvas, coral `#cc785c` accents, ink `#141413` text, serif display
headlines, 96px rhythm. Single self-contained HTML file (inline styles,
no external fetches) so it renders from `file://` anywhere. Launched
from the Showcase button trigger; never a startup redirect.

### Regeneration policy

The showcase regenerates when its sources change (milestone close,
session end) and is committed alongside the change that altered them.
Stale showcases are worse than none: the builder stamps a generation
date, and anything older than the latest workflow log entry shows a
staleness banner.
