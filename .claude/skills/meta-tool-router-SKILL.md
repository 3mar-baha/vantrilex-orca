# meta-tool-router

Central cognitive routing guide for the Vantrilex ambient agent: how,
why, and when to dynamically select and invoke tools using flexible
intelligence rather than static rules.

## When to use

Every autonomous cycle: a runner concludes, a directive arrives, or an
approval lands. Route by reasoning about the situation, not by matching
fixed triggers.

## Routing table (reasons, not rules)

| Situation | Route to | Why |
|---|---|---|
| Session exited or went idle with output | `briefing.ts` via `TerminalWatcher` conclusion | The transcript holds the verdict; the brain interprets it |
| Owner directive, spoken or typed | `prompt-orchestrator.ts` (`orchestrateDirective`) | Intent needs state grounding + Template-M engineering |
| Engineered prompt ready | `handleRunnerInject` on the newest alive session | The active runner is the execution surface |
| Post-dispatch | `watcher.resetSession(sessionId)` | Fresh transcript attribution for the new task |
| Ambient mute requested | `agent:arm` → briefing gate | Watcher keeps recording; only speech stops |
| No alive session at dispatch | Surface `TerminalValidationError` | Never invent a target; tell the owner to open a runner |
| Tool failure (provider, state, inject) | Typed error + incident note | Never swallow; never retry blindly — escalate or degrade |

## Tool inventory

- Observe: `TerminalWatcher` (`src/main/agent/terminal-watcher.ts`)
- Interpret + speak: `briefConclusion` (`src/main/agent/briefing.ts`),
  Ammani brain + Fish TTS (`src/main/voice/`)
- Engineer + dispatch: `orchestrateDirective`
  (`src/main/agent/prompt-orchestrator.ts`), Template-M builder
- Inspect: `readWorkspaceState` (checkpoint, roadmap, diff),
  `listWorktrees`/`summarizeDiff` (`src/main/voice/orca-tools.ts`)
- Control: `window.api.agent` (`directive`, `arm`, `status`)

## Rules

- Prefer the tool whose contract matches the situation's need, not the
  tool used last time. State the reason in one line when routing.
- One cycle, one dispatch. Never chain injections without an observed
  conclusion in between.
- Muted speech never means muted observation. The ledger of conclusions
  is the agent's memory.
- Every route taken must be explainable from the situation above. If no
  row fits, report the gap instead of forcing a tool.
