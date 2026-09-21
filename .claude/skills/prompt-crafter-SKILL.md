# prompt-crafter

Autonomous engineering of production prompts from spontaneous user
intent for the Vantrilex ambient agent.

## When to use

The owner issues a high-level, spontaneous directive — spoken or typed
— and the agent must turn it into a comprehensive, production-grade
runner prompt. Never treat the directive as a fixed keyword or match it
against rigid patterns; understand intent semantically.

## Modules (`src/main/agent/prompt-orchestrator.ts`)

- `buildEngineeringPrompt(directive, state)` — Template-M: owner
  directive grounded with active checkpoint (`docs/10-CHECKPOINT.md`
  with `HANDOFF.md` fallback), roadmap context (`docs/08-ROADMAP.md`
  with `TIMELINE.md` fallback), and `git diff --stat`.
- `orchestrateDirective(deps, directive, workspace)` — validates the
  directive is non-blank, reads project state, asks the Ammani brain to
  engineer the prompt, injects it into the active runner, then rearms
  the watcher on the injected session. State-read failure raises typed
  `OrchestratorError` before any injection.
- `readWorkspaceState(workspace)` — the production state reader (fs +
  bounded git subprocess). Injectable seam for tests.

## Rules

- Intent is interpreted by the brain, never by regex or keyword lists.
  If the directive is ambiguous, engineer the safest reversible next
  step and say what was assumed.
- Ground every prompt in live project state: checkpoint, roadmap, diff.
  A prompt engineered from a stale snapshot is a defect.
- Blank directives and unreadable workspaces fail typed at the
  boundary — no injection, no silent default.
- The engineered prompt is returned to the caller for logging before
  dispatch; dispatch and re-arm are one atomic sequence.
