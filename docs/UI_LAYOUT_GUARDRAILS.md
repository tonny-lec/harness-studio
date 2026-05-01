# Harness Studio UI Goal

Harness Studio should feel like a canvas-first harness design workspace, not a vertically stacked form editor and not an oversized empty canvas.

Before implementing another Design workspace layout change, use the implementation-ready wireframe in [DESIGN_WORKSPACE_WIREFRAME.md](DESIGN_WORKSPACE_WIREFRAME.md).

# Primary Layout Principles

- Canvas is the main workspace.
- Left pane is for navigation and structure overview.
- Right pane is for selected object inspection.
- Validate and Export should be separate focused modes.
- Advanced details should use progressive disclosure.
- Do not show all forms at once.
- Do not make the canvas so large that nodes become lost in empty space.
- Do not compress side panels so much that content becomes unreadable.

# Minimum Usability Constraints

- Canvas should be readable at default zoom.
- Existing sample nodes should be visible without excessive panning or zooming.
- Left outline should be readable and scroll internally.
- Right inspector should be readable and scroll internally.
- Main workspace should fit the viewport.
- Panels should not clip content.
- Avoid huge vertical empty space.
- Avoid layouts that only work on very large monitors.

# Responsibility Split

- Left pane: Harness Outline / navigation
- Center: Canvas / workflow structure
- Right pane: selected object inspector
- Validate tab: validation review
- Export tab: blueprint and prompt outputs

# Do Not

- Do not place full editing forms in every pane at once.
- Do not hide the actual workflow nodes in a large empty canvas.
- Do not implement layout changes that cannot be inspected at normal browser size.
- Do not reintroduce loop as an Edge concept.
