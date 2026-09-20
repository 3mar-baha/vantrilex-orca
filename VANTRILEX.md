# Vantrilex Orca Fork — Inventory (Step 1)

Upstream: `https://github.com/stablyai/orca` @ `96c1dd8b70`
Fork root: `O:\Claude Code\vantrilex-orca` (28,422 files, ~1.0 GB working tree).
Donor repo (untouched): `O:\Claude Code\vantrilex-ts`.

## License verdict: FORK PERMITTED

`LICENSE` = **MIT License, Copyright (c) 2026 Lovecast Inc.**
Standard MIT grant (use, copy, modify, merge, publish, distribute,
sublicense, sell). Maintain the copyright notice in all copies. No
additional contributor terms found at root.

## Toolchain

- Package manager: **pnpm 12** (`packageManager: pnpm@12.0.0+sha512…`), `pnpm-workspace.yaml`, frozen lockfile installs.
- Build: `electron-vite` (`build:electron-vite`), `tsc` project refs
  (`typecheck:node/cli/web`), native rebuilds (`build:native`,
  `rebuild:electron`, `ensure-native-runtime.mjs`), `electron-builder`
  via `config/electron-builder.config.cjs` (`build:win`, `build:mac`,
  `build:linux`, `build:unpack`).
- Lint/test: `oxlint` (+ anti-slop, design-system, dead-classes configs),
  `vitest` (`config/vitest.config.ts`), Playwright e2e
  (`tests/playwright.config.ts`, electron-headless/headful projects).
- Runtime deps of note: `node-pty ^1.1.0`, `@xterm/headless`,
  `@xterm/addon-serialize`, `@monaco-editor/react`, `@tanstack/react-virtual`.

## Extension points for the Vantrilex integration

| Mission item | Hook point in fork |
|---|---|
| Cinematic splash (pre-window) | `src/renderer/src/startup/` (ssh-restore, diagnostics live here), `src/renderer/src/App.tsx`, `main.tsx`, `components/onboarding/` (`FirstLaunchBanner`, `Landing.tsx`, `feature-wall/`) |
| Toolbar/menu slots (mic, showcase, QR) | `components/tab-bar/`, `components/status-bar/`, `components/sidebar/` |
| Settings (voice toggle, keys) | `components/settings/`, `app-shell/app-root-surface-settings.ts`, `components/agent/AgentSettingsDialog.tsx` |
| Terminal panel (xterm + PTY, multi-tab) | `components/terminal/` (`Terminal.tsx`, `TerminalSurface.tsx`, `TerminalWorkbenchContainer.tsx`, `TerminalTitlebarTabs.tsx`, `TerminalWorktreeSplitSurface.tsx`), `components/terminal-pane/`, `floating-terminal/`, `terminal-quick-commands/`; `node-pty` + `smoke:windows-pty-native-capability` already present |
| Worktrees (parallel agents) | `components/worktree-creation/`, `WorktreeJumpPalette*`, `TerminalWorktreeSplitSurface.tsx`, `bench:worktree-deletion` |
| Mobile + relay | `components/mobile/`, `src/mobile-web/`, `src/relay/`, `cloud/` |
| Skills (foundry/voice skills land here) | `skills/` + `src/main/skills`, `generate:bundled-skill-guides`, `verify:skill-bundle-manifest` |
| Workspace lifecycle (silent foundry trigger) | `components/NewWorkspaceComposer*`, `components/repo/`, `src/renderer/src/startup/` |
| Workspace session/scanner | `src/main/` agent services (`agent-awake-service*`, `agent-state-file-reader*`) |

## Step 1 verdict

Clone integrity: full history present, HEAD `96c1dd8b70`, tree clean.
No code modified. Next: Step 2 splash (canvas engine + logo, pre-window hook).
