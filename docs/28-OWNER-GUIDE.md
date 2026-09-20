# 28 — Owner Guide — Vantrilex Agentic Workbench & Launcher

## Purpose

Developer and end-user operational handbook: daily workflows, controls,
and startup sequence in one place.

## Status

Covers shipped behavior (Steps 1–3) and specified controls (Steps 4–6).
Regenerated on every release.

## Schema

### Startup sequence

1. Cinematic space-warp splash (skip on click/key; auto-advance 6.0s).
2. Native Orca ADE fades in; worktree surface restores.
3. Opening a repo triggers silent foundry provisioning: a scanning
   toast, then a configured/error toast. Nothing to click, ever.
4. Keyring self-check arms voice subsystems when pools are present.

### Daily workflows

| Task | How |
|---|---|
| Start supervised work | Open the repo; wait for the configured toast; launch a runner in the terminal panel (Step 5) |
| Speak to the fleet (Step 4) | Mic toggle → speak Ammani → hear Ammani status inside 2s |
| Approve a remote step (Step 6) | Phone notification → one tap in the Happy app |
| Review project state | Showcase button → `docs/showcase.html` dashboard |
| Switch voice (Step 4) | Voice selector toggles male/female reference |
| Ship a release (Step 7) | Green suite → packaging run → NSIS installer → tag |

### Shortcut controls

| Control | Location | Effect |
|---|---|---|
| Microphone toggle | Discrete toolbar trigger | Voice listen on/off |
| Showcase button | Discrete toolbar trigger | Opens the dashboard |
| QR pairing modal | Happy Coder trigger | Pair/unpair mobile device |
| Voice selector | Persistent preference | Male/female voice toggle |

### Troubleshooting first aid

No toast on repo-open → check the workspace path binding and reload.
Voice silent → check keyring status toast and mic permission. Approval
stuck → confirm relay reachability; desktop fallback always available.
Anything else → `docs/14-RUNBOOK.md` procedures in order.
