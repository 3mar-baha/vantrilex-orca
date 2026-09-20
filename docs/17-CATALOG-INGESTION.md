# 17 — Catalog Ingestion — Vantrilex Agentic Workbench & Launcher

## Purpose

Registry synchronization: how the 6 JSON manifests and 7 core skills
stay current, resolved, and consistent between donor and fork.

## Status

Step 3 registries are live in the fork (`src/main/foundry/`,
`.claude/`, `.mcp.json`). Ingestion below is the standing procedure.

## Schema

### Manifests (`data/` in donor; mirrored into fork modules)

| Manifest | Contents | Consumer |
|---|---|---|
| `skills_registry.json` | Skill definitions incl. the 7 core skills | `foundry-skills.ts` |
| `mcp_registry.json` | MCP server descriptors (filesystem, fetch, memory, sequential-thinking) | `.mcp.json` arming |
| `agents_registry.json` | Agent personas (`architect`, `refactoring-specialist`, …) | `.claude/agents/` |
| `hooks_registry.json` | Hook specs (commit-guard, lint-format-verify, session-checkpoint) | `.claude/hooks/` |
| `plugins_registry.json` | Plugin descriptors | Tooling matrix |
| `immunology_ledger.json` | 60 failure-mode entries | `foundry-immune-ledger.ts` |

### Procedure

1. Diff donor `data/` against the fork mirrors.
2. Port changes module-by-module (never bulk-copy generated code).
3. Re-run the affected suites (detection/scaffold/toast) plus typecheck.
4. Commit as `chore(catalog): sync <manifest> to <donor-sha>`.

### Toolkit resolution

When a plan names a tool, resolution order is: provisioned fork module
→ installed MCP → standard library → new dependency (justified, never
for ten lines). Unknown tool names halt the plan; invention is
forbidden.
