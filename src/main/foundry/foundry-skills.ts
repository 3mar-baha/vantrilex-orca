import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

export const SKILL_CREATOR = 'skill-creator'
export const SKILL_FOUNDER = 'vantrilex-project-founder'
export const SKILL_ONBOARDER = 'vantrilex-project-onboarder'
export const SKILL_REVERSE_ENGINEER = 'vantrilex-project-reverse-engineer'
export const SKILL_STACK_SELECTOR = 'vantrilex-stack-selector'
export const SKILL_SHOWCASE_BUILDER = 'project-showcase-builder'
export const SKILL_STRESS_TESTER = 'project-stress-tester'

export const CORE_SKILLS: string[] = [
  SKILL_CREATOR,
  SKILL_FOUNDER,
  SKILL_ONBOARDER,
  SKILL_REVERSE_ENGINEER,
  SKILL_STACK_SELECTOR,
  SKILL_SHOWCASE_BUILDER,
  SKILL_STRESS_TESTER
]

const skillCreatorFallback = `---
name: skill-creator
description: Author new agent skills. Use when creating a skill from scratch or improving an existing one.
---

# skill-creator (embedded fallback)

The upstream skill-creator body lives in the toolkit cache. Sync the
toolkit (Doctor stage, S key) to upgrade this file automatically.

## Workflow

1. Name the skill with a verb phrase describing the job it does.
2. Write frontmatter: name plus one-line description starting with a verb.
3. Document trigger conditions: when the skill applies and when it does not.
4. Write the procedure as numbered steps an agent can execute blind.
5. Add two worked examples: one standard case, one edge case.
6. Keep the whole file under 500 lines; link, do not paste, long references.

## Quality bar

Every step is observable (produces a file, a command result, or a quoted
finding). No step says "consider" without saying what to output.
`

const skillFounder = `---
name: vantrilex-project-founder
description: Found greenfield projects (Case 1). Interview the owner, draft the 28-file docs hierarchy, select the stack, and synthesize gated workflows.
---

# vantrilex-project-founder (Case 1 — Greenfield)

## 1. Concept intake

Ask the owner for one concept paragraph: what the product does, for whom,
and why now. Do not proceed on a one-line idea; ask one clarifying round
first if the paragraph is missing users or value.

## 2. Ten crucial questions

Formulate exactly 10 non-technical questions (business, users, value,
workflow) and present them in ONE copyable block so the owner can answer
elsewhere or delegate to another AI. Cover: primary user, painful problem,
current workaround, definition of done, must-have versus nice-to-have,
success metric, budget and timeline bounds, integrations, risks, and
launch audience.

## 3. Populate in four batches

Fill all 28 files under docs/ with complete prose (every section filled in,
no placeholder text), in this order:

- Batch 1 Vision: docs/VISION.md, docs/ai/PROJECT-CONTEXT.md,
  docs/01-PRODUCT-REQUIREMENTS.md, docs/02-PRODUCT-SPECIFICATION.md,
  docs/08-ROADMAP.md.
- Batch 2 Architecture: docs/03-TECHNICAL-SPECIFICATION.md,
  docs/04-ARCHITECTURE.md, docs/05-DATA-MODEL.md,
  docs/06-API-SPECIFICATION.md, docs/12-SECURITY.md,
  docs/00-MAP-OF-ARCHITECTURE.md.
- Batch 3 Execution: docs/07-IMPLEMENTATION-PLAN.md,
  docs/09-DECISIONS.md, docs/10-CHECKPOINT.md, docs/11-TESTING.md,
  docs/13-DEPLOYMENT.md, docs/14-RUNBOOK.md, docs/15-ORACLE-DEPLOY.md,
  docs/00-MAP-OF-TESTING-AND-AUDITS.md.
- Batch 4 Governance: docs/TIMELINE.md, docs/PROJECT-JOURNEY.md,
  docs/HANDOFF.md, docs/ai/AI-INSTRUCTIONS.md, docs/16-WORKFLOWS.md.

Then write the run-generated governance outputs for this session:
docs/OWNER_ACTION_REQUIRED.md and docs/OWNER-NEXT-STEPS.md.

## 4. Stack selection

Invoke vantrilex-stack-selector against the provisioned catalog
(agents, skills, plugins, hooks, MCP servers) and record the picks in
docs/07-IMPLEMENTATION-PLAN.md with one-line reasons.

## 5. Workflows

Synthesize docs/16-WORKFLOWS.md entries with strict
/plan -> /code -> /test -> /sync gates before any implementation begins.
`

const skillOnboarder = `---
name: vantrilex-project-onboarder
description: Extend documented projects (Case 2). Ingest existing architecture, expand features, provision missing tools, update workflows.
---

# vantrilex-project-onboarder (Case 2 — Documented existing)

## 1. Ingest

Read docs/01-PRODUCT-REQUIREMENTS.md, docs/04-ARCHITECTURE.md, and
docs/00-MAP-OF-ARCHITECTURE.md end to end. Summarize the system back to
the owner in five lines and confirm understanding before continuing.

## 2. Feature expansion

Prompt the owner for the new feature or expansion scope. Map it to
affected components, data entities, contracts, and tests, citing the
numbered docs by section.

## 3. Tool gap check

Search the provisioned catalog for MCPs, skills, agents, and plugins the
expansion needs. Provision missing tools through the launcher flow, then
record every addition in docs/07-IMPLEMENTATION-PLAN.md with its reason.

## 4. Update

Extend the affected numbered docs in the same change, append a
docs/09-DECISIONS.md entry, and add docs/16-WORKFLOWS.md entries with
/plan -> /code -> /test -> /sync gates. Refresh docs/HANDOFF.md last.
`

const skillReverseEngineer = `---
name: vantrilex-project-reverse-engineer
description: Document undocumented codebases (Case 3). Read code as truth via inspection, rebuild the 28 docs files, and draft remediation.
---

# vantrilex-project-reverse-engineer (Case 3 — Undocumented existing)

## 1. Zero interview

Ask the owner nothing. The code is the truth; missing docs are the gap.

## 2. Code-as-truth inspection

Inventory manifests, entry points, dependency graphs, state shapes,
network and filesystem touchpoints, and test coverage using file
inspection and AST-level reading. Quote file paths with line numbers for
every structural claim.

## 3. Populate the 28 files

Rebuild every docs/ file from observed behavior, marking inferred intent
as inferred (with the code evidence cited) rather than inventing product
rationale. Every section is filled in completely; unknown intent is recorded as
an open question in docs/09-DECISIONS.md.

## 4. Gap and remediation report

Generate docs/reports/CODEBASE_GAP_AND_REMEDIATION_REPORT.md: every gap
between observed code and required practice, ranked by risk, each with a
concrete remediation step. Also write docs/REMEDIATION_PLAN.md and
docs/AUDIT_REPORT.md for the run, then select remediation tools from the
catalog and draft docs/16-WORKFLOWS.md entries with gated steps.
`

const skillStackSelector = `---
name: vantrilex-stack-selector
description: Select matching MCPs, agents, skills, and plugins from the provisioned catalog for a project. Invoked by the founder, onboarder, and reverse-engineer skills.
---

# vantrilex-stack-selector

## Inputs

The project summary (docs/ai/PROJECT-CONTEXT.md), the requirements
(docs/01-PRODUCT-REQUIREMENTS.md), and the architecture
(docs/04-ARCHITECTURE.md).

## Procedure

1. Extract capability needs: data sources, protocols, languages,
   review gates, automation hooks.
2. Search each provisioned registry (agents, skills, plugins, hooks,
   MCP servers) with token queries per need; prefer exact-name matches,
   then tag matches.
3. Score candidates: maintained source, narrow scope, composability.
   Reject overlapping picks; one job, one tool.
4. Emit a selection table (need, pick, kind, reason) and write it into
   docs/07-IMPLEMENTATION-PLAN.md under Provisioned tooling, replacing any
   prior table wholesale.
5. List rejected near-misses with one-line reasons so future runs do not
   re-litigate them.

## Rules

Select only provisioned items. If no provisioned item fits a need, record
the gap in docs/08-ROADMAP.md as a milestone dependency instead of
inventing a tool.
`

const skillShowcaseBuilder = `---
name: project-showcase-builder
description: Generate a DESIGN.md-governed interactive docs/showcase.html with architecture diagrams, live test metrics, and a WebGL knowledge graph.
---

# project-showcase-builder

## 1. Ingest the visual standard

Read DESIGN.md as strict law: warm-cream canvas (#faf9f5), coral primary
(#cc785c, active #a9583e), ink text (#141413), dark surfaces (#181715),
Copernicus/Tiempos serif display at weight 400 with negative tracking,
StyreneB/Inter body, JetBrains Mono code, 12px card radii with 32px
padding, pill badges (9999px, 4px 12px), 96px section rhythm. Never use
cool grays, pure white canvas, bold serif, or cyan accents.

## 2. Gather content

Pull project identity from docs/VISION.md and docs/ai/PROJECT-CONTEXT.md,
structure from docs/04-ARCHITECTURE.md, live test metrics by running the
commands in docs/11-TESTING.md, and nodes/edges for the knowledge graph
from docs/00-MAP-OF-ARCHITECTURE.md.

## 3. Generate docs/showcase.html

Emit one zero-dependency HTML file: hero band with serif headline,
feature-card grid, dark code-window card with real snippets, model and
metrics cards, and an interactive knowledge graph rendered on Canvas
with a WebGL upgrade path when available. Inline all CSS and JS; no
external fonts, no CDN, no build step.

## 4. Footer badge

Sign the footer with a subtle Generated by Vantrilex badge on the dark
footer band. Nothing else on the page references the generator.
`

const skillStressTester = `---
name: project-stress-tester
description: Detect the project stack, scaffold a load and fuzz harness, and report bottlenecks with file and line locations.
---

# project-stress-tester

## 1. Detect the stack

Inspect manifests: go.mod (Go), package.json (Node), pyproject.toml or
setup.py (Python), Cargo.toml (Rust). Record the choice and the exact
test and bench commands for that stack.

## 2. Scaffold the harness

Create a dedicated harness directory (stress/ or equivalent): a load
driver that ramps concurrency in stages, and a fuzz driver that feeds
malformed inputs to parsers and handlers. The harness exits non-zero on
any failure and prints machine-readable timing lines.

## 3. Measure

Run the harness and record latency percentiles, peak memory, and error
rates per concurrency stage. Repeat the peak stage to confirm stability
before concluding.

## 4. Report

Write docs/reports/STRESS_TEST_REPORT.md: stack and commands, stage
table with latency, memory, and errors, and every bottleneck pinned to
file and line. Each bottleneck links a remediation item in
docs/REMEDIATION_PLAN.md.
`

const EMBEDDED_BODIES: Record<string, string> = {
  [SKILL_CREATOR]: skillCreatorFallback,
  [SKILL_FOUNDER]: skillFounder,
  [SKILL_ONBOARDER]: skillOnboarder,
  [SKILL_REVERSE_ENGINEER]: skillReverseEngineer,
  [SKILL_STACK_SELECTOR]: skillStackSelector,
  [SKILL_SHOWCASE_BUILDER]: skillShowcaseBuilder,
  [SKILL_STRESS_TESTER]: skillStressTester
}

function toolkitSkillCreatorBody(): string | null {
  const root = join(homedir(), '.vantrilex', 'toolkit')
  const candidates = [
    join(root, 'anthropic-skills', 'skills', 'skill-creator', 'SKILL.md'),
    join(root, 'anthropic-skills', 'skill-creator', 'SKILL.md')
  ]
  for (const candidate of candidates) {
    try {
      const body = readFileSync(candidate, 'utf8')
      if (body.trim().length > 0) {
        return body
      }
    } catch {
      continue
    }
  }
  return null
}

export function skillBody(dir: string): string {
  if (dir === SKILL_CREATOR) {
    return toolkitSkillCreatorBody() ?? EMBEDDED_BODIES[SKILL_CREATOR]
  }
  const body = EMBEDDED_BODIES[dir]
  if (!body) {
    throw new Error(`unknown core skill: ${dir}`)
  }
  return body
}

export type SkillsResult = {
  created: string[]
  kept: string[]
}

export function provisionCoreSkills(workspace: string): SkillsResult {
  const created: string[] = []
  const kept: string[] = []
  for (const dir of CORE_SKILLS) {
    const rel = `.claude/skills/${dir}/SKILL.md`
    const abs = join(workspace, '.claude', 'skills', dir, 'SKILL.md')
    if (existsSync(abs)) {
      kept.push(rel)
      continue
    }
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, skillBody(dir), 'utf8')
    created.push(rel)
  }
  return { created, kept }
}
