---
name: Harness Studio
version: 1.0.0
description: A calm, canvas-first developer tool for designing AI coding-agent harness workflows.
colors:
  background: "#f7f9ff"
  canvas-background: "#edf4ff"
  canvas-grid-background: "#f8fbff"
  surface: "#ffffff"
  surface-subtle: "#fbfcfe"
  surface-muted: "#f7f8fb"
  surface-raised: "#ffffff"
  surface-navigation: "#f8fbff"
  surface-selected: "#ffffff"
  text-primary: "#091d2e"
  text-strong: "#18212f"
  text-secondary: "#344255"
  text-muted: "#657386"
  text-soft: "#526173"
  border: "#dce2eb"
  border-subtle: "#e4e9f0"
  border-strong: "#bfc7d2"
  border-control: "#cad3df"
  border-divider: "#dbe5ef"
  primary: "#006397"
  primary-strong: "#2251d1"
  primary-soft: "#92ccff"
  primary-muted: "#edf4ff"
  success: "#00866a"
  success-strong: "#006f58"
  success-soft: "#e8f7f2"
  loop: "#7c4dff"
  loop-strong: "#4324a7"
  loop-soft: "#f1edff"
  loop-border: "#cbbcff"
  warning: "#d98218"
  warning-strong: "#93540f"
  warning-soft: "#fff3df"
  danger: "#c84037"
  danger-strong: "#8f241f"
  danger-soft: "#fff0ee"
  node-task: "#2f6fed"
  node-context: "#00866a"
  node-agent: "#9f4fd1"
  node-review: "#be5b16"
  node-gate: "#59616f"
typography:
  font-family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  display:
    font-size: 28px
    font-weight: "900"
    line-height: 1.15
  title:
    font-size: 24px
    font-weight: "900"
    line-height: 1.15
  heading:
    font-size: 18px
    font-weight: "800"
    line-height: 1.4
  section-title:
    font-size: 16px
    font-weight: "800"
    line-height: 1.4
  body:
    font-size: 14px
    font-weight: "500"
    line-height: 1.5
  body-small:
    font-size: 13px
    font-weight: "500"
    line-height: 1.5
  node-title:
    font-size: 15px
    font-weight: "900"
    line-height: 1.4
  node-body:
    font-size: 12.5px
    font-weight: "500"
    line-height: 1.4
  label:
    font-size: 13px
    font-weight: "800"
    line-height: 1.4
  meta:
    font-size: 12px
    font-weight: "800"
    line-height: 1.4
  badge:
    font-size: 11px
    font-weight: "900"
    line-height: 1.4
  micro-badge:
    font-size: 10px
    font-weight: "900"
    line-height: 1.4
spacing:
  unit: 4px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  "2xl": 14px
  "3xl": 16px
  "4xl": 18px
  "5xl": 20px
  "6xl": 24px
  "7xl": 28px
  "8xl": 32px
  panel-padding: 18px
  card-padding: 16px
  control-padding-x: 14px
  control-padding-y: 10px
  toolbar-padding: 12px
  canvas-padding: 16px
  section-gap: 14px
  field-gap: 6px
sizing:
  header-height: 64px
  left-pane-width: 280px
  right-pane-width: 340px
  center-min-width: 560px
  canvas-min-height: 420px
  node-width: 220px
  node-min-height: 118px
  button-height: 40px
  compact-button-height: 34px
  input-min-height: 40px
  textarea-min-height: 92px
  long-textarea-min-height: 104px
radii:
  none: 0
  control: 6px
  card: 6px
  panel: 6px
  fieldset: 8px
  loop-region: 16px
  pill: 999px
borders:
  hairline: "1px solid #dce2eb"
  divider: "1px solid #dbe5ef"
  control: "1px solid #cad3df"
  selected: "1px solid #92ccff"
  node: "1px solid #bfc7d2"
  loop-region: "2px dashed #7c4dff"
shadows:
  card: "0 10px 24px rgba(25, 33, 46, 0.05)"
  card-elevated: "0 10px 30px rgba(25, 33, 46, 0.06)"
  node: "0 8px 18px rgba(20, 29, 43, 0.12)"
  node-selected: "0 0 0 3px rgba(0, 99, 151, 0.16), 0 12px 24px rgba(20, 29, 43, 0.16)"
  loop-selected: "0 0 0 4px rgba(124, 77, 255, 0.16), 0 8px 18px rgba(20, 29, 43, 0.12)"
  popover: "0 8px 20px rgba(25, 33, 46, 0.12)"
  pill: "0 6px 14px rgba(67, 36, 167, 0.12)"
elevation:
  base:
    background: "#ffffff"
    border: "1px solid #dce2eb"
    shadow: "0 10px 24px rgba(25, 33, 46, 0.05)"
  canvas:
    background: "#f8fbff"
    border: "1px solid #c8d6e5"
    shadow: "inset 0 0 0 1px rgba(0, 99, 151, 0.04)"
  selected-object:
    background: "#ffffff"
    border: "1px solid #92ccff"
    shadow: "inset 4px 0 0 #006397"
motion:
  duration-fast: 120ms
  duration-standard: 180ms
  duration-slow: 240ms
  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-emphasized: "cubic-bezier(0.2, 0, 0, 1)"
  hover-feedback: "border and background changes, no large movement"
  selection-feedback: "outline or inset accent, no layout shift"
opacity:
  disabled: 0.55
  canvas-grid-dot: 0.32
  loop-region-fill: 0.72
  translucent-panel: 0.92
layout:
  mode: "canvas-first workspace"
  top-navigation: "compact persistent header with Design, Validate, and Export modes"
  left-pane: "outline and structure navigation"
  center-pane: "largest area; React Flow canvas and node toolbar"
  right-pane: "selected object inspector"
  overflow: "side panes scroll internally; canvas stays bounded to the viewport"
components:
  button-primary:
    background-color: "#2251d1"
    text-color: "#ffffff"
    border-radius: 8px
    min-height: 40px
    padding: "0 14px"
    font-weight: "700"
  button-secondary:
    background-color: "#ffffff"
    text-color: "#243246"
    border: "1px solid #d6dde8"
    border-radius: 8px
    min-height: 40px
    padding: "0 14px"
    font-weight: "700"
  button-danger:
    background-color: "#fff7f6"
    text-color: "#8f241f"
    border: "1px solid #f0c4bf"
    border-radius: 8px
    min-height: 40px
    padding: "0 14px"
    font-weight: "700"
  input:
    background-color: "#fbfcfe"
    text-color: "#18212f"
    border: "1px solid #cad3df"
    border-radius: 6px
    padding: 10px
    font-weight: "500"
  panel:
    background-color: "#ffffff"
    border: "1px solid #dce2eb"
    border-radius: 6px
    padding: 16px
    shadow: "0 10px 24px rgba(25, 33, 46, 0.05)"
  canvas:
    background-color: "#f8fbff"
    grid-color: "rgba(112, 120, 129, 0.32)"
    grid-size: 24px
    border: "1px solid #c8d6e5"
    min-height: 420px
  workflow-node:
    background-color: "#ffffff"
    text-color: "#18212f"
    border: "1px solid #bfc7d2"
    border-top-width: 5px
    border-radius: 6px
    width: 220px
    min-height: 118px
    padding: 14px
    shadow: "0 8px 18px rgba(20, 29, 43, 0.12)"
  workflow-loop-region:
    background: "linear-gradient(135deg, rgba(124, 77, 255, 0.08), rgba(0, 134, 106, 0.05)), rgba(246, 244, 255, 0.72)"
    border: "2px dashed rgba(124, 77, 255, 0.72)"
    border-radius: 16px
  badge:
    background-color: "#f7f8fb"
    text-color: "#344255"
    border: "1px solid #d6dde8"
    border-radius: 999px
    padding: "3px 7px"
---

# Harness Studio Design System

Harness Studio is a quiet, professional developer tool for designing AI coding-agent harnesses. Its visual identity should communicate structure, inspection, and controlled iteration rather than marketing polish or decorative expression. The interface should feel like a practical workbench for building a harness: users scan the outline, inspect workflow steps, adjust handoffs and loops, validate the design, then export a blueprint or task prompt.

## Look And Feel

The product uses a light, low-saturation workspace aesthetic. White surfaces sit on pale blue-gray backgrounds, with deep navy text and restrained blue accents. The tone is calm and technical: dense enough for repeated professional use, but not visually heavy.

The primary metaphor is a design canvas. Workflow nodes should feel like durable objects placed on a structured surface. Connections describe one-way handoff flow. Workflow loops are harness-level structures and should be visibly grouped without being mistaken for edges.

## Layout Intent

The application is organized around three modes: Design, Validate, and Export. Design is the canvas-first workspace. Validate is a design review surface. Export is a focused preview and copy surface for generated documents.

The Design workspace uses a three-pane responsibility split:

- The left pane is a Harness Outline for navigation and structural overview.
- The center pane is the main canvas, with a compact add-node toolbar and readable workflow objects.
- The right pane is the selected-object inspector, showing editable details for the selected harness object.

Side panels should scroll internally. The canvas should be the largest area, but it should not become a large empty wall where the workflow is hard to find. Sample workflows should be readable at normal desktop size without excessive panning or zooming.

## Color Strategy

Blue is the primary interaction and selection color. Green marks reusable context, success, and exit states. Purple marks workflow loops and grouped iteration. Orange and red are reserved for validation warnings and errors.

Most surfaces are white or near-white. Borders do much of the visual organization work, so they should remain visible but quiet. Avoid saturated backgrounds except for small badges, state indicators, and node accents.

## Typography

Use Inter or a close system sans-serif fallback. Typography should prioritize scanability over expressiveness. Section labels, badges, and node metadata use high font weight to help the interface remain readable at tool density.

Headlines should be compact. Do not use oversized hero typography inside the app workspace. Node titles and selected-object labels should be visually stronger than helper text and metadata.

## Surfaces And Elevation

Cards and panels use small radii and soft shadows. The design should not feel like a stack of decorative cards; elevation is used only to separate working surfaces from the canvas and background.

The canvas itself uses a subtle dot grid and a pale blue-gray field. This grid should support orientation without competing with nodes, labels, or loop regions.

## Workflow Nodes

Workflow nodes are the primary design objects. They should be readable, compact, and stable. Each node uses a top accent color to communicate type:

- Task nodes use blue.
- Context nodes use green.
- Agent nodes use purple.
- Review nodes use orange.
- Gate nodes use gray.

Selection should be obvious through a blue outline glow. Loop membership should be visible through purple treatment, but selected loop membership should be stronger than passive loop membership.

## Workflow Loops

Workflow loops are harness-level control structures, not edge types. They should be represented as grouped canvas regions or strong membership treatments. Use purple dashed regions, loop labels, and selected-loop highlighting to make iteration visually understandable.

Loop visuals should answer three questions at a glance:

- Which nodes are included?
- Where does the loop begin?
- Where does the loop exit?

Do not represent loops as backward edges unless the product model changes.

## Forms And Inspectors

Forms belong in focused inspectors, not in every pane at once. Textareas must be comfortable for prompt-like editing, including Japanese text, spaces, and multiline content.

The right inspector may contain long structured editors, but it must scroll internally and maintain usable textarea heights. Avoid collapsed fields and cramped input rows. Labels should remain bilingual where the product benefits from preserving canonical English prompt terms.

## Validation Language

Validation UI should be direct and practical. It should distinguish errors, warnings, and info without turning the interface into an alert dashboard. Use red only for blocking structural problems, orange for incomplete design areas, and blue for informational guidance.

## Interaction Principles

Interactions should feel immediate and low ceremony. Selection, editing, dragging, connecting, and copying should not cause layout shifts. Prefer visible selection states, subtle hover feedback, and clear scroll ownership over animation-heavy behavior.

Use motion sparingly. This is a design tool for repeated use, so transitions should be short and functional.

## Do

- Keep the canvas central and readable.
- Keep the left pane navigation-first.
- Keep the right pane focused on the selected object.
- Make workflow loops visible as structures.
- Preserve strong text contrast and comfortable form editing.
- Use semantic color consistently across nodes, validation, and loop states.

## Do Not

- Do not make the app feel like a marketing page.
- Do not turn the Design workspace into one long vertical form stack.
- Do not make the canvas so large that nodes feel lost.
- Do not compress side panels until fields become unreadable.
- Do not reintroduce loop behavior as an edge responsibility.
- Do not use decorative gradients, orbs, or large hero treatments in the workspace.
