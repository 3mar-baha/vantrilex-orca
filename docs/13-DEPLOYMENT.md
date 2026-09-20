# 13 — Deployment — Vantrilex Agentic Workbench & Launcher

## Purpose

Build, artifact, environment, migration, and rollback steps.

## Status

Production promotion requires a green `/test` gate. Steps 1–3 artifacts
are built and verified; installer promotion lands in Step 7.

## Schema

### Pipeline

| Stage | Command | Environment | Rollback |
|---|---|---|---|
| Install | `pnpm install` (host arch) / `pnpm install:release` (packaging archs) | Dev + CI | Lockfile revert |
| Typecheck | `pnpm tc` (node + web + relay refs) | CI | Fix-forward in scope |
| Lint | `pnpm lint` gates; `check:code-quality:changed` per change | CI | Same |
| Unit/integration | `vitest run` targeted + full before release | CI | Red blocks merge |
| Build | `electron-vite build` (main, preload, renderer) | CI | Artifact discarded |
| Package (Step 7) | electron-builder NSIS x64 → `dist/win-unpacked/` | Release runner | Tag withheld |
| Release (Step 7) | `v1.0.0` tag on green `HEAD` | GitHub | Tag deletion + hotfix |

### Environments

Development runs `electron-vite dev` with the native runtime guard
(`ensure:electron-runtime`). CI reproduces install, typecheck, lint,
and tests on Windows (primary), macOS, and Linux. Release builds add
the arch-complete install so no native module ships thin.

### Asset loading

Relative asset resolution (`base: './'`) keeps the packaged renderer
working from `file://` and unpacked directories. No absolute local
paths in build output; no machine-specific constants in shipped code.
