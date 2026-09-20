# 15 — Distribution — Vantrilex Agentic Workbench & Launcher

## Purpose

Windows NSIS packaging path from green tree to signed installer.

## Status

Specified in full; executed in Step 7. The lazy-bootstrapping invariant
holds at every stage: nothing heavy runs before first use.

## Schema

### Pipeline

| Step | Action | Output |
|---|---|---|
| 1. Arch install | `pnpm install:release` (x64 + arm64 when targeting Mac) | Complete native modules per arch |
| 2. Verify | Full `tsc`, `oxlint`, Vitest suite, secrets audit, CSP review | Green gate record |
| 3. Build | `electron-vite build` for main/preload/renderer | `out/` bundles |
| 4. Pack | electron-builder with NSIS target (Windows x64) | `dist/win-unpacked/` staging |
| 5. Installer | NSIS one-click installer assembly | Versioned `.exe` setup |
| 6. Tag | `v1.0.0` on the exact green `HEAD` | Release tag |

### Invariants

- **Lazy bootstrapping:** splash, daemon copies (`%LOCALAPPDATA%`
  relocation), and voice model checks defer until first use; cold start
  stays under the splash 6.0s advance.
- **glibc floor:** bundled natives must run on Ubuntu 20.04 / glibc 2.31;
  packaging fails otherwise.
- **No thin installs:** the `beforePack` guard turns a missing native
  module or `extraResources` source into a build failure, never a
  silently broken artifact.
- **Zero plaintext secrets** in the artifact: keyring is OS-provided at
  runtime; nothing ships keys.
