import type {
  ContextPack,
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessValidationIssue,
  HandoffContract,
  StepContract,
  ValidationSeverity,
} from "../types/harness";

const hasText = (value: string | undefined) => Boolean(value?.trim());

const hasItems = (items: string[]) => items.some((item) => hasText(item));

const isContextPackEmpty = (contextPack: ContextPack) =>
  !hasItems(contextPack.projectFacts) &&
  !hasItems(contextPack.domainNotes) &&
  !hasItems(contextPack.sourceMap) &&
  !hasItems(contextPack.conventions) &&
  !hasItems(contextPack.reusableConstraints) &&
  !hasItems(contextPack.validationCommands) &&
  !hasItems(contextPack.knownRisks);

const hasStepContractContent = (stepContract: StepContract) =>
  hasItems(stepContract.requiredInputs) ||
  hasItems(stepContract.producedArtifacts) ||
  hasItems(stepContract.allowedActions) ||
  hasItems(stepContract.qualityGates) ||
  hasItems(stepContract.handoffNotes) ||
  hasItems(stepContract.failureModes);

const hasHandoffContent = (handoff: HandoffContract | undefined) =>
  Boolean(
    handoff &&
    (hasItems(handoff.transferredArtifacts) ||
      hasItems(handoff.conditions) ||
      hasText(handoff.notes)),
  );

const issue = (
  id: string,
  severity: ValidationSeverity,
  scope: HarnessValidationIssue["scope"],
  title: string,
  message: string,
  recommendation?: string,
  targetId?: string,
): HarnessValidationIssue => ({
  id,
  severity,
  scope,
  targetId,
  title,
  message,
  recommendation,
});

const normalizedSet = (items: string[]) =>
  new Set(items.filter(hasText).map((item) => item.trim().toLocaleLowerCase()));

const findNode = (nodes: HarnessNode[], nodeId: string) => nodes.find((node) => node.id === nodeId);

const validateNode = (node: HarnessNode): HarnessValidationIssue[] => {
  const issues: HarnessValidationIssue[] = [];

  if (!hasText(node.promptBrief.goal)) {
    issues.push(
      issue(
        `node-${node.id}-prompt-goal`,
        "warning",
        "node",
        "Missing Prompt Brief goal",
        `${node.name} does not define what Codex should accomplish for this workflow step.`,
        "Add a concise Goal to the selected node's Prompt Brief.",
        node.id,
      ),
    );
  }

  if (!hasItems(node.promptBrief.successCriteria)) {
    issues.push(
      issue(
        `node-${node.id}-success-criteria`,
        "warning",
        "node",
        "Missing success criteria",
        `${node.name} does not define completion criteria for this workflow step.`,
        "Add Success Criteria so the step has a clear definition of done.",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.requiredInputs)) {
    issues.push(
      issue(
        `node-${node.id}-required-inputs`,
        "warning",
        "node",
        "Missing required inputs",
        `${node.name} does not describe what inputs it needs before work can start.`,
        "Add Required Inputs to the node's Step Contract.",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.producedArtifacts)) {
    issues.push(
      issue(
        `node-${node.id}-produced-artifacts`,
        "warning",
        "node",
        "Missing produced artifacts",
        `${node.name} does not describe what it produces for later steps.`,
        "Add Produced Artifacts to the node's Step Contract.",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.qualityGates)) {
    issues.push(
      issue(
        `node-${node.id}-quality-gates`,
        "warning",
        "node",
        "Missing quality gates",
        `${node.name} does not define validation or acceptance checks for this step.`,
        "Add Quality Gates to the node's Step Contract.",
        node.id,
      ),
    );
  }

  return issues;
};

const validateEdge = (edge: HarnessEdge, nodes: HarnessNode[]): HarnessValidationIssue[] => {
  const issues: HarnessValidationIssue[] = [];
  const source = findNode(nodes, edge.source);
  const target = findNode(nodes, edge.target);
  const sourceHasContract = source ? hasStepContractContent(source.stepContract) : false;
  const targetHasContract = target ? hasStepContractContent(target.stepContract) : false;
  const sourceName = source?.name ?? edge.source;
  const targetName = target?.name ?? edge.target;

  if (!hasHandoffContent(edge.handoff)) {
    issues.push(
      issue(
        `edge-${edge.id}-handoff`,
        sourceHasContract && targetHasContract ? "warning" : "info",
        "edge",
        "Missing handoff contract",
        `${sourceName} -> ${targetName} does not describe what flows across the connection.`,
        "Add transferred artifacts, handoff conditions, or notes when this edge represents meaningful work product.",
        edge.id,
      ),
    );
  }

  if (edge.handoff && !hasItems(edge.handoff.transferredArtifacts)) {
    issues.push(
      issue(
        `edge-${edge.id}-transferred-artifacts`,
        "warning",
        "edge",
        "Missing transferred artifacts",
        `${sourceName} -> ${targetName} has a handoff contract without transferred artifacts.`,
        "Describe the artifacts, decisions, findings, or instructions passed to the next step.",
        edge.id,
      ),
    );
  }

  if (
    source &&
    target &&
    hasItems(source.stepContract.producedArtifacts) &&
    hasItems(target.stepContract.requiredInputs)
  ) {
    const produced = normalizedSet(source.stepContract.producedArtifacts);
    const hasExactMatch = target.stepContract.requiredInputs.some((input) =>
      produced.has(input.trim().toLocaleLowerCase()),
    );

    if (!hasExactMatch) {
      issues.push(
        issue(
          `edge-${edge.id}-input-artifact-match`,
          "info",
          "edge",
          "Required input may not match upstream artifacts",
          `${targetName} requires inputs that do not exactly match artifacts produced by ${sourceName}. This is a heuristic and may need manual judgment.`,
          "Align artifact names where the handoff is intentional, or use handoff notes to explain the mapping.",
          edge.id,
        ),
      );
    }
  }

  return issues;
};

export function validateHarness(harness: Harness): HarnessValidationIssue[] {
  const issues: HarnessValidationIssue[] = [];

  if (isContextPackEmpty(harness.contextPack)) {
    issues.push(
      issue(
        "harness-empty-context-pack",
        "warning",
        "harness",
        "Context Pack is empty",
        "The harness has no reusable project or domain context.",
        "Add reusable project/domain knowledge so node prompts do not need to repeat everything.",
      ),
    );
  }

  if (harness.nodes.length === 0) {
    issues.push(
      issue(
        "harness-no-nodes",
        "error",
        "harness",
        "No workflow steps",
        "This harness does not contain any promptable workflow steps.",
        "Add at least one workflow step.",
      ),
    );
  }

  if (harness.nodes.length > 1 && harness.edges.length === 0) {
    issues.push(
      issue(
        "harness-unconnected-steps",
        "warning",
        "harness",
        "Workflow steps are not connected",
        "The harness has multiple workflow steps but no handoff flow.",
        "Connect steps to describe handoff flow.",
      ),
    );
  }

  harness.nodes.forEach((node) => {
    issues.push(...validateNode(node));
  });

  harness.edges.forEach((edge) => {
    issues.push(...validateEdge(edge, harness.nodes));
  });

  return issues;
}
