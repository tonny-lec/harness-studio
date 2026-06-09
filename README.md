# Harness Studio

Harness Studio is a web app for building **agentic workflows / harnesses without
the intimidation factor**: assemble a workflow on screen, then download it in a
form you can actually run.

- **Build**: a vertical pipeline editor. Each step needs only one thing — an
  instruction. Step kinds (計画 / 調査 / 実行 / レビュー / チェック) come with
  sensible defaults, and loop blocks repeat steps until a check passes.
- **Download**:
  - **Codex Runner (ZIP)** — a standalone Node.js runner built on the
    [OpenAI Codex SDK](https://developers.openai.com/codex/sdk). Each step runs
    as a Codex agent thread that can read/edit files and run commands in a
    target directory. Gates return structured PASS/FAIL verdicts; loops retry
    with feedback. `npm install && node run.mjs --dir <repo> "<task>"`.
  - **Claude Code Pack (ZIP)** — CLAUDE.md + per-step slash commands +
    `/harness-run` orchestrator for running the workflow inside Claude Code.
  - **workflow.json** — the machine-readable design, re-importable into the
    studio.

## Stack

- React + TypeScript + Vite
- Zustand (localStorage persistence)
- JSZip (ZIP export)

## Local Development

```bash
npm install
npm run dev
```

## Commands

```bash
npm run dev
npm run build
npm run format
npm run format:check
```

## Documentation

- [docs/PRODUCT_MODEL.md](docs/PRODUCT_MODEL.md) — the v2 data model
  (Workflow / Step / Loop) and design rationale
- [docs/AGENTIC_WORKFLOW_BASICS.md](docs/AGENTIC_WORKFLOW_BASICS.md) —
  fundamentals: agents vs workflows, core patterns, failure modes (Japanese)
- [docs/HARNESS_DESIGN_GUIDE.md](docs/HARNESS_DESIGN_GUIDE.md) — what a
  harness is and how the exports map the design onto real runtimes (Japanese)
- [docs/SELF_IMPROVEMENT_LOOP_GUIDE.md](docs/SELF_IMPROVEMENT_LOOP_GUIDE.md) —
  letting the AI improve its own workflow via the bundled `improve.mjs`
  (Japanese)

## Current Scope

- Frontend-only Vite app, localStorage persistence
- Template gallery + blank workflows + workflow.json import
- Vertical pipeline editor with step cards and loop blocks
- Inline validation (empty instructions, loops without exits, gates outside loops)
- Runnable exports: Codex Runner, Claude Code Pack, workflow.json

## Not Implemented Yet

- Backend APIs / authentication / database persistence
- Running workflows from inside the browser
- Branching (conditional paths other than loop exits)
