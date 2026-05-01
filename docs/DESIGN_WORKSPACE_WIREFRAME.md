# Design Workspace Wireframe

This document defines the intended Design tab structure before another UI implementation attempt. It is a product and layout specification, not a pixel-perfect visual design.

# Design Workspace Goal

The Design workspace should feel like a canvas-first harness design tool.

It should help users understand and edit:

- Workflow Steps
- Connections / Handoffs
- Workflow Loops
- Context Pack
- Prompt Brief
- Step Contract
- Harness Overview

The workspace should support design thinking: see the harness structure first, select an object, then edit details in context.

# Layout Responsibilities

## Top Area

The top area should remain compact and stable.

It should contain:

- Harness title
- Short harness description
- Design / Validate / Export tabs
- Primary actions only if needed

It should not become a second editor region.

## Left Pane

The left pane is navigation and structure overview.

It should contain:

- Harness Overview entry
- Context Pack entry
- Workflow Steps list
- Connections list
- Workflow Loops list
- Validation Issues entry
- Export entry

It should support selecting or focusing an object when practical.

It should not contain full editing forms for:

- Harness metadata
- Context Pack
- Prompt Brief
- Step Contract

## Center

The center is the visual design workspace.

It should contain:

- Add node toolbar
- React Flow canvas
- Workflow Step nodes
- Connection edges
- Workflow Loop membership indicators
- Selected object state
- Validation issue markers if available

The canvas should be the largest visual area, but it should not become an oversized empty surface where the sample workflow is hard to find.

## Right Pane

The right pane is the Selected Object Inspector.

It should show details for one selected object at a time:

- Harness Overview
- Context Pack
- Workflow Step
- Connection
- Workflow Loop
- Validation Issue

Long sections should use progressive disclosure when needed. The inspector should scroll internally rather than forcing the full page to grow.

# Approximate Layout Constraints

For normal desktop width:

- Left pane should be readable, not compressed.
- Right inspector should be readable, not compressed.
- Canvas should be the largest area.
- Sample harness nodes should be visible without excessive zooming or panning.
- The screen should not become an extremely tall empty canvas.
- Panels should scroll internally when content exceeds available height.
- The layout should not depend on a very large monitor.
- Avoid pixel-perfect fixed heights that fail on smaller desktop screens.
- Prefer viewport-aware workspace sizing with clear overflow ownership.

Approximate proportions:

- Left pane: narrow-to-medium navigation width.
- Center canvas: largest column.
- Right pane: medium inspector width.

These proportions are guidance only. Usability at a normal browser size matters more than exact ratios.

# Selected Object Inspector Behavior

## None Selected

Show an empty state that explains how to use the workspace:

- Select a workflow step, connection, loop, Harness Overview, or Context Pack from the canvas or outline.
- Keep the message short.

## Harness Overview Selected

Show:

- Harness name
- Harness description
- Summary counts:
  - Workflow Steps
  - Connections
  - Workflow Loops
  - Validation Issues

Harness metadata editing belongs here, not in the left pane.

## Context Pack Selected

Show and edit Context Pack sections:

- Project Facts
- Domain Notes
- Source Map
- Conventions
- Reusable Constraints
- Validation Commands
- Known Risks

Use progressive disclosure if the content is too long for the inspector. Do not expand every large textarea by default if it makes the inspector unreadable.

## Workflow Step Selected

Show:

- Name
- Type
- Node Role
- Notes
- Prompt Brief section
- Step Contract section
- Delete node action

Prompt Brief and Step Contract belong to the selected node. Do not show editors for every node at once.

## Connection Selected

Show:

- Source -> target
- Connection type: Normal / Conditional
- Transferred artifacts
- Conditions
- Notes

Connection remains a one-way handoff. Do not add Loop as a connection type.

## Workflow Loop Selected

Show:

- Name
- Included nodes
- Entry node
- Exit target node
- Max iterations
- Exit conditions
- Loop artifacts
- Notes

Workflow Loop belongs to the Harness. It is not an Edge and not a Node.

## Validation Issue Selected

If implemented, show:

- Issue severity
- Issue title
- Affected object
- Message
- Recommendation
- Action to select or focus the affected object when practical

The full validation review belongs in the Validate tab.

# What Does Not Belong In The Design Tab

The Design tab should not show:

- Full Export Preview
- Full Validation issue list
- All Prompt Brief editors at once
- All Step Contract editors at once
- All Context Pack sections expanded by default
- Runtime execution UI
- Deployment UI

Validate and Export should remain separate focused modes.

# Future Implementation Acceptance Criteria

A future Design workspace implementation is acceptable only if:

- Design screen is readable at normal desktop size.
- Existing sample nodes are visible and readable.
- Left pane is navigation-first.
- Right pane is selected-object-first.
- Canvas is visually the main workspace.
- There is no giant empty vertical canvas.
- Side panels are not compressed into unreadable columns.
- Panels scroll internally when needed.
- Validate and Export remain separate tabs.
- Loop is not reintroduced as Edge responsibility.
- Existing data model responsibilities are preserved.
