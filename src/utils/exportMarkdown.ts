import type {
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessNodeType,
  HarnessValidationIssue,
  PromptBrief,
  StepContract,
} from "../types/harness";
import { createEmptyPromptBrief } from "./promptBrief";
import { validateHarness } from "./validateHarness";

export type ExportFormat = "agents" | "investigation" | "implementation" | "review" | "blueprint";

export const exportFormatLabels: Record<ExportFormat, string> = {
  agents: "Repository Guidance Lite",
  investigation: "Investigation Prompt",
  implementation: "Implementation Prompt",
  review: "Review Prompt",
  blueprint: "Harness Blueprint",
};

const list = (items: string[], fallback = "Not specified yet.") =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;

const nodesByType = (harness: Harness, nodeType: HarnessNodeType) =>
  harness.nodes.filter((node) => node.type === nodeType);

const nodeLine = (node: HarnessNode) => {
  const notes = node.notes ? ` Notes: ${node.notes}` : "";
  return `- ${node.name}: ${node.purpose || "No role captured yet."}${notes}`;
};

const nodeSummary = (nodes: HarnessNode[], fallback: string) =>
  nodes.length > 0 ? nodes.map(nodeLine).join("\n") : `- ${fallback}`;

const workflowSummary = (harness: Harness) =>
  harness.nodes.length > 0
    ? harness.nodes.map(nodeLine).join("\n")
    : "- No workflow steps captured yet.";

const connectionSummary = (harness: Harness) => {
  const connections = harness.edges
    .map((edge) => {
      const source = harness.nodes.find((node) => node.id === edge.source);
      const target = harness.nodes.find((node) => node.id === edge.target);
      return source && target ? `- ${source.name} -> ${target.name}` : null;
    })
    .filter((connection): connection is string => Boolean(connection));

  return connections.length > 0 ? connections.join("\n") : "- No required workflow order captured.";
};

const brief = (node: HarnessNode | null): PromptBrief =>
  node?.promptBrief ?? createEmptyPromptBrief();

const validationList = (harness: Harness, node: HarnessNode | null) =>
  list(
    brief(node).validation.length > 0
      ? brief(node).validation
      : harness.contextPack.validationCommands,
    "Run the smallest relevant build, test, typecheck, lint, or manual check.",
  );

const constraintsList = (harness: Harness, node: HarnessNode | null, fallback: string) =>
  list(
    brief(node).constraints.length > 0
      ? brief(node).constraints
      : harness.contextPack.reusableConstraints,
    fallback,
  );

const outputList = (node: HarnessNode | null, fallbackItems: string[], fallback: string) =>
  list(brief(node).output.length > 0 ? brief(node).output : fallbackItems, fallback);

const stopRulesList = (node: HarnessNode | null, fallbackItems: string[]) =>
  list(brief(node).stopRules.length > 0 ? brief(node).stopRules : fallbackItems);

const successCriteriaList = (node: HarnessNode | null, fallbackItems: string[]) =>
  list(brief(node).successCriteria.length > 0 ? brief(node).successCriteria : fallbackItems);

const availableContextList = (harness: Harness, node: HarnessNode | null, fallback: string) =>
  list(brief(node).availableContext.length > 0 ? brief(node).availableContext : [], fallback);

const goalText = (harness: Harness, node: HarnessNode | null, fallback: string) =>
  brief(node).goal || node?.purpose || harness.description || fallback;

const section = (title: string, items: string[]) =>
  items.length > 0 ? `## ${title}\n\n${list(items, "")}\n` : "";

const promptSection = (title: string, items: string[]) =>
  items.length > 0 ? `# ${title}\n\n${list(items, "")}\n` : "";

const subsection = (title: string, items: string[]) =>
  items.length > 0 ? `### ${title}\n\n${list(items, "")}\n` : "";

const hasStepContractContent = (stepContract: StepContract) =>
  stepContract.requiredInputs.length > 0 ||
  stepContract.producedArtifacts.length > 0 ||
  stepContract.allowedActions.length > 0 ||
  stepContract.qualityGates.length > 0 ||
  stepContract.handoffNotes.length > 0 ||
  stepContract.failureModes.length > 0;

const stepContractSection = (stepContract: StepContract, heading = "Step Contract") => {
  if (!hasStepContractContent(stepContract)) {
    return "";
  }

  return `# ${heading}

${subsection("Required Inputs", stepContract.requiredInputs)}
${subsection("Expected Artifacts", stepContract.producedArtifacts)}
${subsection("Allowed Actions", stepContract.allowedActions)}
${subsection("Quality Gates", stepContract.qualityGates)}
${subsection("Handoff", stepContract.handoffNotes)}
${subsection("Failure Modes", stepContract.failureModes)}`;
};

const nodePromptBriefSummary = (node: HarnessNode) => {
  const items = [
    node.promptBrief.goal ? `Goal: ${node.promptBrief.goal}` : "",
    ...node.promptBrief.successCriteria.map((item) => `Success: ${item}`),
    ...node.promptBrief.validation.map((item) => `Validation: ${item}`),
    ...node.promptBrief.output.map((item) => `Output: ${item}`),
  ].filter(Boolean);

  return items.length > 0 ? list(items, "") : "- No prompt brief details captured.";
};

const edgeLine = (harness: Harness, edge: HarnessEdge) => {
  const source = harness.nodes.find((node) => node.id === edge.source);
  const target = harness.nodes.find((node) => node.id === edge.target);
  const base = `${source?.name ?? edge.source} -> ${target?.name ?? edge.target}`;

  if (!edge.handoff) {
    return `- ${base} (type: Normal)`;
  }

  const details = [
    `type: ${edge.handoff.kind}`,
    edge.handoff.transferredArtifacts.length > 0
      ? `artifacts: ${edge.handoff.transferredArtifacts.join(", ")}`
      : "",
    edge.handoff.conditions.length > 0 ? `conditions: ${edge.handoff.conditions.join(", ")}` : "",
    edge.handoff.notes ? `notes: ${edge.handoff.notes}` : "",
  ].filter(Boolean);

  return details.length > 0 ? `- ${base} (${details.join("; ")})` : `- ${base}`;
};

const edgeBlueprintSection = (harness: Harness, edge: HarnessEdge) => {
  const source = harness.nodes.find((node) => node.id === edge.source);
  const target = harness.nodes.find((node) => node.id === edge.target);
  const handoff = edge.handoff;

  if (!handoff) {
    return `### ${source?.name ?? edge.source} -> ${target?.name ?? edge.target}

- Type: Normal
- Handoff details are not captured yet.`;
  }

  return `### ${source?.name ?? edge.source} -> ${target?.name ?? edge.target}

- Type: ${handoff.kind === "conditional" ? "Conditional" : "Normal"}
${handoff.transferredArtifacts.length > 0 ? `\nTransferred artifacts:\n${list(handoff.transferredArtifacts)}` : ""}
${handoff.conditions.length > 0 ? `\nConditions:\n${list(handoff.conditions)}` : ""}
${handoff.notes ? `\nNotes:\n- ${handoff.notes}` : ""}`;
};

const nodeName = (harness: Harness, nodeId: string | undefined) =>
  nodeId ? (harness.nodes.find((node) => node.id === nodeId)?.name ?? nodeId) : "Not specified";

const workflowLoopSection = (harness: Harness) => {
  if (harness.loops.length === 0) {
    return "- No workflow loops defined yet.";
  }

  return harness.loops
    .map(
      (loop) => `### ${loop.name}

Included nodes:
${list(
  loop.nodeIds.map((nodeId) => nodeName(harness, nodeId)),
  "No included nodes specified.",
)}

- Entry node: ${nodeName(harness, loop.entryNodeId)}
- Exit target: ${nodeName(harness, loop.exitTargetNodeId)}
- Max iterations: ${loop.maxIterations}

Exit conditions:
${list(loop.exitConditions, "No exit conditions captured.")}

Loop artifacts:
${list(loop.loopArtifacts, "No loop artifacts captured.")}

Default unresolved behavior:
- If max iterations are reached before exit conditions are met, stop and report the unresolved state.

${loop.notes ? `\nNotes:\n- ${loop.notes}` : ""}`,
    )
    .join("\n\n");
};

const validationCounts = (issues: HarnessValidationIssue[]) => ({
  error: issues.filter((issue) => issue.severity === "error").length,
  warning: issues.filter((issue) => issue.severity === "warning").length,
  info: issues.filter((issue) => issue.severity === "info").length,
});

const validationIssueLine = (issue: HarnessValidationIssue) =>
  `- ${issue.severity.toUpperCase()}: ${issue.title} (${issue.scope}) - ${issue.message}`;

const validationSummary = (harness: Harness) => {
  const issues = validateHarness(harness);
  const counts = validationCounts(issues);
  const visibleIssues = issues.slice(0, 12);
  const remainingCount = issues.length - visibleIssues.length;

  return `## Harness Validation Summary

- Total issues: ${issues.length}
- Errors: ${counts.error}
- Warnings: ${counts.warning}
- Info: ${counts.info}

${
  visibleIssues.length > 0
    ? visibleIssues.map(validationIssueLine).join("\n")
    : "- No validation issues found."
}
${remainingCount > 0 ? `\n- ${remainingCount} additional issues omitted from this summary.` : ""}`;
};

const selectedNodeIntro = (node: HarnessNode | null) =>
  node
    ? `Selected workflow step: ${node.name}\n\nNode role: ${node.purpose || "No role captured yet."}${
        node.notes ? `\n\nNotes: ${node.notes}` : ""
      }`
    : "Select a workflow step to generate this task-specific prompt.";

const noSelectedNodeMarkdown = (harness: Harness, formatLabel: string) => `# ${formatLabel}

Select a workflow step to generate this task-specific prompt.

## Workflow Summary

${workflowSummary(harness)}

## Workflow Order

${connectionSummary(harness)}
`;

export function exportAgentsMd(harness: Harness): string {
  return `# ${harness.name}

> This document is intended to stay short. Put task-specific details in Investigation, Implementation, or Review prompts instead.

## Project Overview

${harness.description || "Describe the repository purpose, main surfaces, and important ownership boundaries."}

${section("Project Facts", harness.contextPack.projectFacts)}
${section("Source Map", harness.contextPack.sourceMap)}
## Core Conventions

${list(
  harness.contextPack.conventions.length > 0
    ? harness.contextPack.conventions
    : [
        "Follow existing code style, structure, naming, and testing patterns.",
        "Keep changes scoped to the task and nearby contracts.",
        "Prefer simple code that fits the current project over speculative abstractions.",
        "Preserve unrelated user or teammate changes.",
      ],
  "Follow existing project conventions.",
)}

## Validation

${list(
  harness.contextPack.validationCommands,
  "Document common build, test, lint, typecheck, or manual validation commands here.",
)}

## Repository Constraints

${list(
  harness.contextPack.reusableConstraints,
  "Document durable repository constraints here. Avoid task-specific instructions.",
)}

${section("Known Risks", harness.contextPack.knownRisks)}
## Workflow Summary

${workflowSummary(harness)}
`;
}

export function exportInvestigationPrompt(
  harness: Harness,
  selectedNode: HarnessNode | null,
): string {
  if (!selectedNode) {
    return noSelectedNodeMarkdown(harness, "Investigation Prompt");
  }

  const contextNodes = nodesByType(harness, "context");
  const taskNodes = nodesByType(harness, "task");

  return `# Role

You are Codex investigating an existing codebase before implementation.

# Goal

${goalText(harness, selectedNode, "Understand the relevant code paths, data structures, risks, and likely change surface before any edits.")}

# Success Criteria

${successCriteriaList(selectedNode, [
  "Relevant files, flows, contracts, and tests are identified",
  "Facts are separated from assumptions",
  "Risks and unknowns that could change the implementation are called out",
  "No code changes are made",
])}

# Available Context

${selectedNodeIntro(selectedNode)}

Harness: ${harness.name}

Task signals:
${nodeSummary(taskNodes, "Use the selected workflow step as the primary task signal.")}

Context signals:
${nodeSummary(contextNodes, "Inspect the codebase to discover the necessary context.")}

Workflow hints:
${connectionSummary(harness)}

Selected step context:
${availableContextList(harness, selectedNode, harness.description || "Use the repository, user request, and nearby code as context.")}

${promptSection("Reusable Context", [
  ...harness.contextPack.sourceMap,
  ...harness.contextPack.domainNotes,
  ...harness.contextPack.knownRisks,
  ...harness.contextPack.reusableConstraints,
])}
# Workflow Summary

${workflowSummary(harness)}

# Investigation Focus

Identify the smallest set of files, flows, data models, UI paths, commands, and edge cases needed to implement safely. Avoid prescribing a search order unless the codebase makes one obvious.

# Constraints

${constraintsList(harness, selectedNode, "Do not implement changes during this investigation.")}

${stepContractSection(selectedNode.stepContract)}

# Output

${outputList(
  selectedNode,
  [
    "Relevant files and flows inspected",
    "Confirmed facts",
    "Assumptions or unknowns",
    "Recommended implementation approach",
    "Risks and validation plan",
  ],
  "Summarize the investigation findings, risks, and recommended implementation path.",
)}

# Stop Rules

${stopRulesList(selectedNode, [
  "Stop before editing files",
  "Ask for the smallest missing information only if proceeding would materially change the implementation or create real risk",
])}
`;
}

export function exportImplementationPrompt(
  harness: Harness,
  selectedNode: HarnessNode | null,
): string {
  if (!selectedNode) {
    return noSelectedNodeMarkdown(harness, "Implementation Prompt");
  }

  const agentNodes = nodesByType(harness, "agent");
  const gateNodes = nodesByType(harness, "gate");

  return `# Role

You are Codex implementing a focused code change.

# Goal

${goalText(harness, selectedNode, "Deliver working code that satisfies the task while preserving existing behavior.")}

# Success Criteria

${successCriteriaList(selectedNode, [
  "The requested behavior is implemented",
  "Existing behavior remains intact unless the task explicitly changes it",
  "The solution follows local codebase conventions",
  "Relevant validation is run or the best available alternative is reported",
])}

# Available Context

${selectedNodeIntro(selectedNode)}

Harness: ${harness.name}

Implementation signals:
${nodeSummary(agentNodes, "Make the smallest coherent change that satisfies the selected workflow step.")}

Workflow hints:
${connectionSummary(harness)}

Selected step context:
${availableContextList(harness, selectedNode, harness.description || "Use investigation findings and local code inspection to identify likely files.")}

${promptSection("Reusable Implementation Context", [
  ...harness.contextPack.conventions,
  ...harness.contextPack.reusableConstraints,
  ...harness.contextPack.validationCommands,
  ...harness.contextPack.knownRisks,
])}
# Workflow Summary

${workflowSummary(harness)}

# Constraints

${constraintsList(harness, selectedNode, "Keep the change scoped and avoid broad speculative refactors.")}

# Working Guidance

Bias toward completing working code. Make reasonable assumptions and continue unless missing information would materially change the implementation or create risk. Do not require a long upfront plan or status preambles; use the codebase as the source of truth.

# Validation

${validationList(harness, selectedNode)}

${stepContractSection(selectedNode.stepContract)}

If validation cannot run, explain why and give the next best check performed.

# Output

${outputList(
  selectedNode,
  [
    "What changed",
    "Validation commands and results",
    "Any assumptions, limitations, or follow-up risks",
  ],
  "Summarize changed behavior, validation, and remaining risk.",
)}

# Stop Rules

${stopRulesList(selectedNode, [
  "Stop if the task requires credentials, external systems, destructive actions, or product decisions that are not available",
  "Stop and ask a focused question if multiple plausible implementations would create meaningfully different user-visible behavior",
])}

Gate signals:
${nodeSummary(gateNodes, "No explicit gate signals captured.")}
`;
}

export function exportReviewPrompt(harness: Harness, selectedNode: HarnessNode | null): string {
  if (!selectedNode) {
    return noSelectedNodeMarkdown(harness, "Review Prompt");
  }

  const reviewNodes = nodesByType(harness, "review");
  const gateNodes = nodesByType(harness, "gate");

  return `# Role

You are Codex reviewing a code change.

# Goal

${goalText(harness, selectedNode, "Find high-value correctness, regression, architecture, type-safety, and test coverage issues.")}

# Success Criteria

${successCriteriaList(selectedNode, [
  "Findings are confirmed and actionable",
  "Correctness and regression risk are prioritized over style",
  "Risks or suggestions are clearly labeled as such",
  "The review stays concise by default",
])}

# Review Focus

${selectedNodeIntro(selectedNode)}

Review signals:
${nodeSummary(reviewNodes, "Check whether the change satisfies the selected workflow step without introducing regressions.")}

Workflow hints:
${connectionSummary(harness)}

# Workflow Summary

${workflowSummary(harness)}

${promptSection("Reusable Review Context", [
  ...harness.contextPack.conventions,
  ...harness.contextPack.validationCommands,
  ...harness.contextPack.knownRisks,
])}
# Validation

${validationList(harness, selectedNode)}

# Constraints

${constraintsList(harness, selectedNode, "Avoid nitpicks unless they affect correctness, maintainability, or future changes.")}

${stepContractSection(selectedNode.stepContract)}

# Output

${outputList(
  selectedNode,
  [
    "Findings first, ordered by severity",
    "Include concrete file, line, component, command, or behavior references",
    "If there are no blocking findings, say so clearly and list residual risks",
    "Prefer no more than 5 high-signal findings unless the change is large",
  ],
  "Report high-signal review findings and clearly separate confirmed defects from risks.",
)}

# Stop Rules

${stopRulesList(selectedNode, [
  "Do not rewrite the implementation during review unless explicitly asked",
  "Distinguish confirmed defects from risks, questions, and optional suggestions",
])}

Gate signals:
${nodeSummary(gateNodes, "No explicit gate signals captured.")}
`;
}

export function exportHarnessBlueprint(harness: Harness): string {
  return `# Harness Blueprint: ${harness.name}

${harness.description || "Reusable AI workflow harness design."}

## Context Pack Summary

${section("Project Facts", harness.contextPack.projectFacts)}
${section("Domain Notes", harness.contextPack.domainNotes)}
${section("Source Map", harness.contextPack.sourceMap)}
${section("Conventions", harness.contextPack.conventions)}
${section("Reusable Constraints", harness.contextPack.reusableConstraints)}
${section("Validation Commands", harness.contextPack.validationCommands)}
${section("Known Risks", harness.contextPack.knownRisks)}

## Workflow Overview

${workflowSummary(harness)}

## Handoff Flow

${harness.edges.length > 0 ? harness.edges.map((edge) => edgeLine(harness, edge)).join("\n") : "- No handoffs defined yet."}

## Connection Design

${harness.edges.length > 0 ? harness.edges.map((edge) => edgeBlueprintSection(harness, edge)).join("\n\n") : "- No connections defined yet."}

## Workflow Loops

${workflowLoopSection(harness)}

${validationSummary(harness)}

## Workflow Steps

${harness.nodes
  .map(
    (node) => `### ${node.name}

Type: ${node.type}

Role: ${node.purpose || "No role captured yet."}

${node.notes ? `Notes: ${node.notes}\n` : ""}Prompt Brief:
${nodePromptBriefSummary(node)}

${hasStepContractContent(node.stepContract) ? stepContractSection(node.stepContract, "Step Contract").replace("# Step Contract", "#### Step Contract") : "Step Contract:\n- No step contract details captured."}
`,
  )
  .join("\n")}

## Quality Gates Across Harness

${list(
  harness.nodes.flatMap((node) => node.stepContract.qualityGates),
  "No quality gates captured yet.",
)}

## Known Risks

${list(
  [
    ...harness.contextPack.knownRisks,
    ...harness.nodes.flatMap((node) => node.stepContract.failureModes),
  ],
  "No known risks captured yet.",
)}
`;
}

export function exportHarnessMarkdown(harness: Harness): string {
  return exportAgentsMd(harness);
}

export function exportHarnessByFormat(
  harness: Harness,
  format: ExportFormat,
  selectedNode: HarnessNode | null,
): string {
  switch (format) {
    case "agents":
      return exportAgentsMd(harness);
    case "investigation":
      return exportInvestigationPrompt(harness, selectedNode);
    case "implementation":
      return exportImplementationPrompt(harness, selectedNode);
    case "review":
      return exportReviewPrompt(harness, selectedNode);
    case "blueprint":
      return exportHarnessBlueprint(harness);
  }
}
