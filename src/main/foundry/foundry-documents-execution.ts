import { doc, type FoundryDoc } from './foundry-document-template'

export const FOUNDRY_DOCS_EXECUTION: FoundryDoc[] = [
  {
    path: 'docs/09-DECISIONS.md',
    body: doc(
      '09 — Decisions — {{PROJECT}}',
      'Immutable log of structural choices.',
      'Append-only. Reversals are new entries referencing the original.',
      `### Entries

Date, context, options considered, decision, reason, revisit trigger.
A tradeoff with no revisit trigger is deferred debt.`
    )
  },
  {
    path: 'docs/10-CHECKPOINT.md',
    body: doc(
      '10 — Checkpoint — {{PROJECT}}',
      'The approved-plan ledger that gates all code changes.',
      'An edit or write tool runs only against a checkpoint recorded here.',
      `### Active plan

Plan ID, scope files, MCPs and skills named, test command, rollback
step, approver, approval timestamp. The pre-tool hook reads this
section; absent or expired plans block execution.`
    )
  },
  {
    path: 'docs/11-TESTING.md',
    body: doc(
      '11 — Testing — {{PROJECT}}',
      'Test layers, commands, and justification discipline.',
      'Every change cites the command run and its result in the workflow log.',
      `### Layers

Unit behavior, component seams, and end-to-end journeys from the
product specification.

### Justification

Each test answers what bug it catches that no other test catches.
Tests without an answer are deleted.`
    )
  },
  {
    path: 'docs/12-SECURITY.md',
    body: doc(
      '12 — Security — {{PROJECT}}',
      'Authentication, authorization, secrets, validation, and update policy.',
      'New trust boundaries are recorded here before code crosses them.',
      `### Boundaries

Every boundary (user input, network payloads, deserialized data) with
its validation. Inside a validated boundary, trust the contract.`
    )
  },
  {
    path: 'docs/13-DEPLOYMENT.md',
    body: doc(
      '13 — Deployment — {{PROJECT}}',
      'Build, artifact, environment, migration, and rollback steps.',
      'Production promotion requires a green /test gate.',
      `### Pipeline

Ordered steps with exact commands, environments, promoters, and the
rollback procedure per environment.`
    )
  },
  {
    path: 'docs/14-RUNBOOK.md',
    body: doc(
      '14 — Runbook — {{PROJECT}}',
      'Operational procedures for logs, alerts, incidents, and recovery.',
      'Every alert links a procedure; alerts without procedures are removed.',
      `### Procedures

Symptom, diagnosis steps, fix, and verify per alert. Incident drills
reference docs/11-TESTING.md coverage.`
    )
  },
  {
    path: 'docs/15-ORACLE-DEPLOY.md',
    body: doc(
      '15 — Oracle Deploy — {{PROJECT}}',
      'Oracle Cloud deployment target: tenancy, compartment, and shape plan.',
      'Values are concrete per environment; no placeholder regions or shapes.',
      `### Target

Tenancy and compartment layout, compute shapes, networking, storage,
and the deploy command sequence with rollback.`
    )
  },
  {
    path: 'docs/16-WORKFLOWS.md',
    body: doc(
      '16 — Workflows — {{PROJECT}}',
      'The gated state machine every change travels.',
      'Skipping a gate restarts the workflow at /plan.',
      `### Gates

/plan -> /code -> /test -> /sync — in this order, no skipping.

A /plan names exact MCPs, Skills, files, tests, and rollback, and is
recorded in docs/10-CHECKPOINT.md. Deviations restart /plan.

### Atomic rollback checkpoint

Before /code, create a checkpoint: git stash create for dirty trees
or a checkpoint tag for clean ones. If /test fails more than 3 times,
prompt automated rollback to the checkpoint before further edits.

### Tool gates

Steps may use provisioned MCPs and Skills only. A missing or unusable
required tool halts the workflow with a blocker report.

### Workflow log

Date, plan reference, tests with results, docs updated per workflow.`
    )
  }
]
