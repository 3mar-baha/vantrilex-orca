# voice-pipeline

voice operation for the Vantrilex Agentic Workbench & Launcher.

## When to use

Speak status, transcribe mic input, think via the Ammani brain, inspect
worktrees and diffs for spoken summaries. Spoken output is Ammani
Jordanian Arabic only; code, paths, and commands stay in English.

## Modules (`src/main/voice/`)

- `tts.ts` — `FishTts.speak(text, voice)`: Fish Audio `s2.1-pro-free`,
  male default, female toggle, LRU MP3 cache. Budget: hit < 300ms,
  synthesis < 1.5s.
- `stt.ts` — `GroqStt.transcribe(audio)`: Whisper `whisper-large-v3-turbo`.
  Budget: < 1.0s for clips under 30s.
- `brain.ts` — `AmmaniBrain.think(prompt)`: `openai/gpt-oss-120b` with the
  Ammani system contract. Golden 2.0s, ceiling 5.0s; over-ceiling aborts
  to `LatencyExceededError` with a text fallback.
- `keyring.ts` — `Keyring` over an injected `SecureStore` (production:
  DPAPI `safeStorage`). Pools `fish`/`groq`, rotation every exactly 10
  requests, rollover on the 11th. `status()` reports presence booleans
  only — never key values.
- `orca-tools.ts` — `listWorktrees`, `summarizeDiff` over an injected
  exec seam. Used to ground spoken summaries in real repo state.

## Rules

- Key names and voice reference IDs in docs and code; key values never.
- Provider, transcription, latency, and tool failures are typed errors
  (`TtsProviderError`, `SttProviderError`, `LatencyExceededError`,
  `BrainProviderError`, `ToolError`, `KeyringError`) — never swallowed,
  never generic.
- Every pipeline hop is timed against `docs/18-VOICE-PIPELINE.md`
  budgets; breaches file runbook entries.
- Cancel drains the pipeline within 200ms.
- Executable commands travel as `!run <command>` lines inside the brain
  reply. The renderer forwards each to the terminal target with a submit
  newline; lines without the prefix are speech only, never executed.
