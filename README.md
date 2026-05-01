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

## Not Implemented Yet

- Backend APIs
- Authentication
- Database persistence
- Runtime execution
- Run Log
- Lessons Learned
- Routing
- Import/export files
