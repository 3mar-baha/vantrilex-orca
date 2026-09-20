import { doc, type FoundryDoc } from './foundry-document-template'

export const FOUNDRY_DOCS_GOVERNANCE: FoundryDoc[] = [
  {
    path: 'docs/VISION.md',
    body: doc(
      'Vision — {{PROJECT}}',
      'North star, principles, and non-goals.',
      'Principles resolve tradeoffs; new ones arrive via docs/09-DECISIONS.md.',
      `### North star

One paragraph: the future this project creates.

### Principles

Numbered, tradeoff-resolving. Clarity over cleverness, reversibility
over speed, unless a decision entry says otherwise.

### Non-goals

What success explicitly excludes.`
    )
  },
  {
    path: 'docs/TIMELINE.md',
    body: doc(
      'Timeline — {{PROJECT}}',
      'Dated horizons and review cadence.',
      'Dates move only with a decision entry explaining why.',
      `### Horizons

Now, next, later — each with its shippable outcome.

### Cadence

Risk review, backlog pruning, dependency updates.`
    )
  },
  {
    path: 'docs/PROJECT-JOURNEY.md',
    body: doc(
      'Project Journey — {{PROJECT}}',
      'Dated project memory that survives turnover.',
      'Append shipped work, learnings, and direction changes.',
      `### Log

Date, shipped increment, lesson, direction change with reason.`
    )
  },
  {
    path: 'docs/REMEDIATION_PLAN.md',
    body: doc(
      'Remediation Plan — {{PROJECT}}',
      'Ranked remediation backlog from audits and gap reports.',
      'Items close only with a linked workflow log entry.',
      `### Items

Gap reference, risk rank, remediation step, owner, workflow ID.
Source reports live in docs/reports/.`
    )
  },
  {
    path: 'docs/HANDOFF.md',
    body: doc(
      'Handoff — {{PROJECT}}',
      'Session-to-session continuity.',
      'Regenerated at the end of every session.',
      `### State

Current status, open threads with file and section pointers.

### Next session

The exact first three actions with commands to run.`
    )
  },
  {
    path: 'docs/OWNER_ACTION_REQUIRED.md',
    body: doc(
      'Owner Action Required — {{PROJECT}}',
      'Decisions and approvals only the owner can give.',
      'Empty means nothing is blocked on the owner.',
      `### Items

Question, context, options with recommendation, deadline. Case skills
append here instead of stalling.`
    )
  },
  {
    path: 'docs/OWNER-NEXT-STEPS.md',
    body: doc(
      'Owner Next Steps — {{PROJECT}}',
      "The owner's personal checklist after each session.",
      'Checked items stay visible with completion dates.',
      `### Steps

Ordered actions with commands or links. Regenerated per session by the
active case skill.`
    )
  },
  {
    path: 'docs/AUDIT_REPORT.md',
    body: doc(
      'Audit Report — {{PROJECT}}',
      'Latest audit verdict with evidence.',
      'Superseded reports archive under docs/reports/ with dates.',
      `### Verdict

Pass or fail per area, evidence quoted (file paths, command output),
remediation links into docs/REMEDIATION_PLAN.md.`
    )
  }
]
