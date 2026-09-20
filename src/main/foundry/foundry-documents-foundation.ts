import { doc, type FoundryDoc } from './foundry-document-template'

export const FOUNDRY_DOCS_FOUNDATION: FoundryDoc[] = [
  {
    path: 'docs/ai/AI-INSTRUCTIONS.md',
    body: doc(
      'AI Instructions — {{PROJECT}}',
      'Mandatory operating rules for every AI agent working in this workspace. Read this file before any other action.',
      'Active. Violations halt the workflow.',
      `### Plan Gate (mandatory)

Strict Zero-Action-Without-Plan Policy. The AI is strictly forbidden from
writing or modifying code without an approved /plan detailing the exact
MCPs and Skills to be used. If a required tool cannot be used, halt
immediately and report the blocker instead of improvising.

A valid /plan names: the target files, the MCP servers involved, the
skills applied, the test command that proves the change, and the rollback
step. No plan, no code. No exceptions for small edits.

### Reading order

1. docs/ai/PROJECT-CONTEXT.md for the project summary.
2. docs/00-MAP-OF-ARCHITECTURE.md to locate components.
3. The numbered specification relevant to the task (01 through 16).
4. docs/16-WORKFLOWS.md for the /plan -> /code -> /test -> /sync gates.

### Response rules

- Keep responses strictly in English.
- Prefer small, reversible changes with tests.
- Update the affected numbered doc in the same change that alters behavior.
- Never invent MCP servers, skills, or endpoints; use only provisioned ones.`
    )
  },
  {
    path: 'docs/ai/PROJECT-CONTEXT.md',
    body: doc(
      'Project Context — {{PROJECT}}',
      'One-page orientation for new contributors, human or AI.',
      'Bootstrapped by the Vantrilex Project Foundry.',
      `### Summary

{{PROJECT}} is described end to end in this docs/ hierarchy: intent in
01 through 08, execution in 09 through 16, governance in VISION.md and
TIMELINE.md.

### Entry points

docs/VISION.md, docs/01-PRODUCT-REQUIREMENTS.md,
docs/04-ARCHITECTURE.md, docs/16-WORKFLOWS.md.`
    )
  },
  {
    path: 'docs/00-MAP-OF-ARCHITECTURE.md',
    body: doc(
      'Map of Architecture — {{PROJECT}}',
      'Index from every component to its detail doc.',
      'Update this map whenever a component moves.',
      `| Component | Detail doc |
|---|---|
| Requirements | docs/01-PRODUCT-REQUIREMENTS.md |
| Specification | docs/02-PRODUCT-SPECIFICATION.md |
| Technical design | docs/03-TECHNICAL-SPECIFICATION.md |
| Architecture | docs/04-ARCHITECTURE.md |
| Data model | docs/05-DATA-MODEL.md |
| API contracts | docs/06-API-SPECIFICATION.md |
| Implementation | docs/07-IMPLEMENTATION-PLAN.md |`
    )
  },
  {
    path: 'docs/00-MAP-OF-TESTING-AND-AUDITS.md',
    body: doc(
      'Map of Testing and Audits — {{PROJECT}}',
      'Index from every verification activity to its strategy doc and gate.',
      'Audit findings land in docs/reports/ and triage into governance.',
      `| Activity | Strategy | Gate |
|---|---|---|
| Unit and integration | docs/11-TESTING.md | /test |
| Security review | docs/12-SECURITY.md | /test |
| Runbook drills | docs/14-RUNBOOK.md | /sync |
| Decision log | docs/09-DECISIONS.md | /sync |`
    )
  },
  {
    path: 'docs/01-PRODUCT-REQUIREMENTS.md',
    body: doc(
      '01 — Product Requirements — {{PROJECT}}',
      'The single problem, users, value, and scope boundaries in plain words.',
      'Draft. Every requirement carries an ID and a verification method.',
      `### Problem

One paragraph for a non-technical reader.

### Users and value

Each user group with its measurable outcome and one minimum metric.

### Scope boundaries

What the product explicitly does not do. Unlisted and un-backlogged
work is out of scope.

### Acceptance

IDs (REQ-001, REQ-002, and so on), each with test, review, or demo
verification. A requirement without verification is a wish.`
    )
  },
  {
    path: 'docs/02-PRODUCT-SPECIFICATION.md',
    body: doc(
      '02 — Product Specification — {{PROJECT}}',
      'Feature-level specification derived from docs/01 requirements.',
      'Each feature traces to at least one REQ ID.',
      `### Features

Feature records: ID (FEAT-001, FEAT-002, and so on), parent REQ IDs,
behavior, edge cases, and acceptance criteria in observable terms.

### Personas

Name, role, technical comfort, goal, current workaround, and failure
mode per persona. Low-comfort personas drive guided wording.`
    )
  },
  {
    path: 'docs/03-TECHNICAL-SPECIFICATION.md',
    body: doc(
      '03 — Technical Specification — {{PROJECT}}',
      'Implementation-facing specification: components, flows, and contracts.',
      'Mirrors docs/04-ARCHITECTURE.md at finer granularity.',
      `### Components

One component per section: responsibility, inputs, outputs, and the
contract at each boundary. One component, one owner, one reason to change.

### Flows

Primary flows traced input to output with error branches named.`
    )
  },
  {
    path: 'docs/04-ARCHITECTURE.md',
    body: doc(
      '04 — Architecture — {{PROJECT}}',
      'System structure, dependency direction, and constraints.',
      'Structural changes require a docs/09-DECISIONS.md entry.',
      `### Structure

Components, responsibilities, and dependency direction.

### Constraints

Language, runtime, hosting, and dependency constraints with reasons.`
    )
  },
  {
    path: 'docs/05-DATA-MODEL.md',
    body: doc(
      '05 — Data Model — {{PROJECT}}',
      'Entities, fields, ownership, lifecycle, and retention.',
      'Invariants enforced by the layer named per invariant.',
      `### Entities

Fields with types, required versus optional, lifecycle rules.

### Integrity

Invariants that must always hold, each with its enforcing layer and a
test reference in docs/11-TESTING.md.`
    )
  },
  {
    path: 'docs/06-API-SPECIFICATION.md',
    body: doc(
      '06 — API Specification — {{PROJECT}}',
      'Every endpoint and interface contract in one place.',
      'Published contracts version with migration notes.',
      `### Contracts

Method and path (or signature), inputs with validation, outputs with
shapes, error codes with meanings, versioning policy.`
    )
  },
  {
    path: 'docs/07-IMPLEMENTATION-PLAN.md',
    body: doc(
      '07 — Implementation Plan — {{PROJECT}}',
      'Ordered build sequence from empty tree to shippable increment.',
      'Steps execute through docs/16-WORKFLOWS.md gates only.',
      `### Phases

Numbered phases, each with entry criteria, file-level changes, test
commands, and exit criteria. No phase starts until the prior gate is
green.

### Provisioned tooling

The stack-selector table lives here: need, pick, kind, reason per tool,
plus rejected near-misses so reruns do not re-litigate choices.`
    )
  },
  {
    path: 'docs/08-ROADMAP.md',
    body: doc(
      '08 — Roadmap — {{PROJECT}}',
      'Sequenced milestones from now to launch and beyond.',
      'Milestones move only with a docs/09-DECISIONS.md entry.',
      `### Milestones

Dated milestones, each with the shippable outcome and the requirement
IDs it satisfies. The top item is always the next increment.`
    )
  }
]
