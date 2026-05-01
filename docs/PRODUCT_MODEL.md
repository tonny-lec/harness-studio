# Harness Studio Product Model

Harness Studio is a local frontend tool for designing AI coding-agent harnesses. It should help users design AI work systems and harness engineering workflows, not regress into a prompt-only generator.

## Core Concepts

### Harness

Harness = the whole AI work system or workflow.

A harness contains reusable context, promptable workflow steps, connections between those steps, and exportable design documents.

### Context Pack

Context Pack = shared reusable project and domain context for the harness.

It captures durable knowledge such as project facts, domain notes, source maps, conventions, reusable constraints, validation commands, and known risks.

### Workflow Step / Node

Workflow Step / Node = one promptable workflow step.

A node represents one unit of agent work, such as investigation, implementation, review, or a quality gate.

### Prompt Brief

Prompt Brief = what to ask Codex for that step.

It contains the step-specific prompt structure: goal, success criteria, available context, constraints, validation, output, and stop rules.

### Step Contract

Step Contract = what the step requires, produces, validates, allows, and hands off.

It describes required inputs, produced artifacts, allowed actions, quality gates, handoff notes, and failure modes for a workflow step.

### Handoff Contract

Handoff Contract = what flows across an edge.

It describes transferred artifacts, handoff conditions, and notes for the connection between two workflow steps.

### Repository Guidance Lite

Repository Guidance Lite = short durable repository-level guidance.

It is suitable as a lightweight repository guidance draft and should stay concise. Task-specific details belong in node-level Prompt Briefs and task-specific exports.

### Harness Blueprint

Harness Blueprint = design document for the whole harness.

It summarizes the harness, Context Pack, workflow, nodes, edges, Prompt Briefs, Step Contracts, handoffs, quality gates, and known risks.

## Ownership Model

- Context Pack belongs to the Harness.
- Prompt Brief belongs to each Node.
- Step Contract belongs to each Node.
- Handoff Contract belongs to each Edge.
- Harness Blueprint is generated from the whole Harness.

## Product Direction

Harness Studio should remain a harness design tool. Prompt generation is one output, but the product model should continue to emphasize reusable AI work systems, explicit workflow contracts, and handoffs between promptable steps.
