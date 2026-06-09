# Harness Studio

Harness Studio is a local frontend tool for designing AI coding-agent harnesses. It is meant to help design reusable AI work systems and harness engineering workflows, not just generate one-off prompts.

## Stack

- React
- TypeScript
- Vite
- React Flow
- Zustand

## Product Model

The current product model is documented in [docs/PRODUCT_MODEL.md](docs/PRODUCT_MODEL.md).
What "harness design" means and how the runnable exports map design concepts to
real implementations is documented in
[docs/HARNESS_DESIGN_GUIDE.md](docs/HARNESS_DESIGN_GUIDE.md) (Japanese).
UI layout guardrails for future design work are documented in
[docs/UI_LAYOUT_GUARDRAILS.md](docs/UI_LAYOUT_GUARDRAILS.md).

Key concepts include:

- Harness: the whole AI work system or workflow
- Context Pack: reusable project and domain knowledge shared by the harness
- Workflow Step / Node: one promptable workflow step
- Prompt Brief: what to ask Codex for a step
- Step Contract: what a step requires, produces, validates, allows, and hands off
- Handoff Contract: what flows across an edge
- Harness Blueprint: a design document for the whole harness

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

## Current Scope

- Frontend-only Vite app
- Local Zustand state with localStorage persistence
- Harness list and harness metadata editing
- React Flow canvas with draggable, connectable, removable edges
- Node-level Prompt Brief and Step Contract editing
- Harness-level Context Pack editing
- Export preview for Repository Guidance Lite, task-specific prompts, and Harness Blueprint
- Runnable exports, downloadable as ZIP:
  - **Claude Code Pack** — `CLAUDE.md` + per-step slash commands +
    `/harness-run` orchestrator. Drop into a repository and run the whole
    workflow (loops, gates, artifact handoff) inside Claude Code.
  - **Agent Runner Pack** — standalone Node.js engine (`run.mjs`, official
    `@anthropic-ai/sdk`) that executes the workflow against the Anthropic API:
    topologically ordered steps, structured-output gate verdicts, loop
    iteration with feedback, artifact files, and a run summary.
- Both packs embed `harness.json` (design + execution plan) as the
  machine-readable source of truth.

## Not Implemented Yet

- Backend APIs
- Authentication
- Database persistence
- Importing `harness.json` back into the studio
- Run Log
- Lessons Learned
- Routing
