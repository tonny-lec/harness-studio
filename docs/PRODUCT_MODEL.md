# Product Model (v2)

Harness Studio v2 was rebuilt from zero around one principle: **the intimidating
part of agentic workflows is the jargon and the number of decisions, not the
structure**. The structure of almost every useful workflow is simple — a
sequence of steps, sometimes repeated until a check passes. The product model
mirrors exactly that and nothing more.

## Concepts

| Concept            | What it is                                                                                         | Required input        |
| ------------------ | -------------------------------------------------------------------------------------------------- | --------------------- |
| **Workflow**       | The whole harness: ordered blocks + shared context                                                 | name                  |
| **Step**           | One unit of agent work                                                                             | one instruction text  |
| **Step kind**      | Preset role: 計画 (plan) / 調査 (research) / 実行 (generate) / レビュー (review) / チェック (gate) | — (defaults provided) |
| **Loop block**     | A group of steps repeated until its exit condition holds, up to a max count                        | — (defaults provided) |
| **Shared context** | One free-text field injected into every step (project facts, conventions, constraints)             | — (optional)          |

Compared to v1, the following were deliberately **removed**: free-form canvas
with x/y positions, Prompt Brief (7 fields), Step Contract (6 fields),
Handoff Contract per edge, Context Pack (7 fields). Their jobs are covered by:

- ordering → the vertical pipeline (blocks are an ordered list)
- prompt briefs / contracts → step kind presets + one instruction + optional
  expected output / checklist
- handoffs → automatic: every step receives the outputs of all previous steps
- context pack → the single shared-context field

## Execution semantics

These semantics are implemented identically by both runnable exports:

1. Blocks run top to bottom. Each step's output is saved as an artifact and
   injected into later steps' prompts.
2. A **gate** step returns a structured verdict (pass, reasons, fix
   instructions).
3. A **loop block** runs its steps in order, then checks: the verdict of a gate
   step inside the loop, or — if there is none — an LLM judge evaluating the
   loop's exit condition. On FAIL the loop retries with the fix instructions
   prepended; after max attempts it records UNRESOLVED and the workflow
   continues.
4. A gate that fails **outside** a loop stops the run.

## Ownership

- Step → owns kind, name, instruction, expected output, checklist
- Loop block → owns its steps, max attempts, exit condition
- Workflow → owns block order, name, description, shared context

## Export formats

- **Codex Runner** — `manifest.json` (plan) + `prompts/*.md` + `run.mjs`
  (engine on `@openai/codex-sdk`) + `AGENTS.md` + `workflow.json`
- **Claude Code Pack** — `CLAUDE.md` + `.claude/commands/harness-step-*.md` +
  `/harness-run` orchestrator + `workflow.json`
- **workflow.json** — `{ formatVersion: 2, generator, workflow }`,
  re-importable into the studio
