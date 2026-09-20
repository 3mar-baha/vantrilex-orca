# 18 — Voice Pipeline — Vantrilex Agentic Workbench & Launcher

## Purpose

Full-duplex Ammani Arabic voice control: synthesis, transcription, and
the cognitive brain, inside hard latency budgets.

## Status

Specified for Step 4. No voice code written yet. Budgets below are
acceptance criteria.

## Schema

### Synthesis (Fish Audio TTS)

Direct Fish Audio API client (no proxy, no OpenRouter in the audio
path). Model `s2.1-pro-free`. Dual voice references: default male
`5b90451e0cd34b2788841744af7c55c3`, toggle female
`88c0375e46fa4e3b929755fa077ca5ad`. MP3 output for Chromium native
audio. Local LRU clip cache keyed by text hash + voice ID: cache hit
under 300ms, synthesis under 1.5s. Clips play on desktop speakers;
audio persists only in the session cache.

### Transcription (Groq Whisper STT)

Groq Whisper `whisper-large-v3-turbo` for ultra-low-latency
transcription of mic input and mobile voice notes. Target: under 1.0s
for clips under 30s. Text returns to the session; raw audio is retained
only in the session cache.

### Cognitive brain (Groq GPT-OSS-120B)

`openai/gpt-oss-120b` on Groq LPU. **Golden budget 2.0s end-to-end per
utterance, hard ceiling 5.0s.** Utterances exceeding the ceiling abort
with an error toast and a text fallback. Every hop (STT → brain → TTS)
is timed and logged; budget breaches file runbook entries.

### Language policy

Conversational spoken output is exclusively authentic Ammani Jordanian
Arabic. Code, internal UI, terminal output, logs, and docs remain
English. The brain prompt carries the dialect contract; regressions in
dialect authenticity are P1 bugs.

### RAG corpora (9)

Dialect & phonetics: JODA, APGC, `camel_tools`, MADAR. Conciseness &
BLUF: xl-sum. Agent governance: Prompt-Engineering-Guide. Plus session
memory and the immune ledger as retrieval sources. Local index, rebuilt
per release.

### Keyring linkage

Bearer keys come from the DPAPI pools (`FISH_AUDIO_API_KEY`,
`GROQ_API_KEY`) with 10-request rotation — see `docs/20-KEYRING.md`.
Key names in code and docs; key values never.

### Flow

Mic toggle → Whisper → session text → brain → Ammani reply → Fish TTS →
cache → playback. Mobile voice notes arrive via the Happy channel and
join the same transcription path. Cancel is first-class: `voice:cancel`
drains the pipeline within 200ms.
