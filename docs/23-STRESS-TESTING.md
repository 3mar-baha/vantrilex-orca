# 23 — Stress Testing — Vantrilex Agentic Workbench & Launcher

## Purpose

System resilience benchmarks: what the fork must survive, how it is
proven, and how it recovers.

## Status

Benchmarks specified; executed by the `project-stress-tester` skill
from Step 5 onward, and as a release gate in Step 7.

## Schema

### Benchmarks

| ID | Scenario | Pass criteria |
|---|---|---|
| STRESS-001 | 3 concurrent runner sessions in the embedded panel | All responsive; input latency < 100ms p95 |
| STRESS-002 | Voice pipeline under CPU load (build running) | Utterance still inside 5.0s ceiling |
| STRESS-003 | 50-entry session ledger at cap + rapid provisioning | Append evicts oldest; zero corruption |
| STRESS-004 | Rapid repo switching (10 switches in 5s) | Only latest provision completes; no orphan writes |
| STRESS-005 | Relay disconnect mid-approval | Desktop fallback toast within 2s; no lost verdicts |
| STRESS-006 | Keyring rotation boundary (10th request under load) | Seamless pool advance; zero failed provider calls |
| STRESS-007 | Renderer memory over 8h session | Heap growth bounded; no listener leaks (toast bus unsubscribe verified) |

### Memory pressure and context limits

Long agent transcripts compact at phase boundaries with state carried
by the checkpoint doc and journey log. Cache layers (voice clips,
indexes) honor size caps and evict oldest-first. No unbounded in-memory
arrays on any hot path.

### Concurrency races

Provisioning is single-flight per workspace (cancellation token);
concurrent opens collapse to the latest. Toast IDs are monotonic;
dismiss is idempotent. Approval verdicts are idempotent; double-taps
collapse.

### Recovery

Every benchmark has a rollback: kill -9 the worker and confirm no
partial files; drop the relay and confirm fallback; corrupt the ledger
and confirm quarantine + re-prompt. Recovery behavior is asserted in
suites, not just observed.
