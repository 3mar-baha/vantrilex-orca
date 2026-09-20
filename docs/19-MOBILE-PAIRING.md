# 19 — Mobile Pairing — Vantrilex Agentic Workbench & Launcher

## Purpose

Self-hosted Happy Coder relay integration for QR pairing and remote
step approvals from a phone.

## Status

Specified for Step 6. Relay code lives under `vendor/happy/` when
landed; no relay code written yet.

## Schema

### QR pairing lifecycle

1. Desktop opens the Happy Coder modal and shows a single-use QRencoding a relay URL + pairing nonce (expiring, 120s).
2. Phone scans, relay verifies nonce, desktop toast confirms pairing.
3. Pairing binds one device; re-pairing revokes the previous token.
4. Unpair is explicit in the modal; relay drops the binding immediately.

### Remote step approval queue

Blocked agent steps publish approval requests to the paired device:
question, context, options with recommendation, deadline. One tap
approves or rejects; the verdict returns through the relay into the
agent session. Approvals are idempotent — double-taps collapse to one
verdict. Queue depth and oldest-waiting age surface in the desktop
modal.

### Relay properties

Self-hosted first: the default relay runs on the owner's machine
(`vendor/happy/`), LAN-accessible, no third-party account. Transports
are TLS; payloads carry no secrets, only step references and verdicts.
Voice notes recorded on mobile follow the same transcription path as
mic input (`docs/18-VOICE-PIPELINE.md`).

### Targets

Approval round-trip under 30 seconds on LAN. Pairing ceremony under
60 seconds. Relay failure degrades to desktop-only approval with an
error toast — never a silent stall.
