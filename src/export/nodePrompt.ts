import type { Harness, HarnessNode, HarnessNodeType } from "../types/harness";

/**
 * Placeholders shared by every runnable export target.
 * - {{TASK}}      — the concrete task the user gives at run time.
 * - {{UPSTREAM}}  — artifacts handed off from previously executed steps.
 */
export const TASK_PLACEHOLDER = "{{TASK}}";
export const UPSTREAM_PLACEHOLDER = "{{UPSTREAM}}";

export const nodeTypeLabels: Record<HarnessNodeType, string> = {
  task: "Task Framing",
  context: "Context Gathering",
  agent: "Implementation / Reasoning",
  review: "Review",
  gate: "Quality Gate",
};

const nodeRoleInstructions: Record<HarnessNodeType, string> = {
  task: "Turn the work request into an actionable specification with explicit acceptance criteria. Do not write or change code in this step.",
  context:
    "Gather the files, code paths, patterns, and constraints that later steps need. Separate confirmed facts from assumptions. Do not make changes in this step.",
  agent:
    "Perform the implementation or reasoning work for this step. Bias toward completing working output; make reasonable assumptions and record them.",
  review:
    "Review the produced work for correctness, regressions, and contract violations. Report findings ordered by severity. Do not rewrite the implementation during review.",
  gate: "Decide whether the workflow may continue. Evaluate every quality gate and exit condition, then give an explicit PASS or FAIL verdict with reasons and, on FAIL, concrete fix instructions for the next iteration.",
};

const bulletList = (items: string[], fallback?: string): string => {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return fallback ? `- ${fallback}` : "";
  }
  return cleaned.map((item) => `- ${item}`).join("\n");
};

const optionalSection = (title: string, body: string): string =>
  body ? `## ${title}\n\n${body}\n\n` : "";

const upstreamArtifactNames = (harness: Harness, node: HarnessNode): string[] => {
  const incoming = harness.edges.filter((edge) => edge.target === node.id);
  const fromHandoffs = incoming.flatMap((edge) => edge.handoff?.transferredArtifacts ?? []);
  return Array.from(new Set([...node.stepContract.requiredInputs, ...fromHandoffs]));
};

const outgoingHandoffs = (harness: Harness, node: HarnessNode): string[] =>
  harness.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => {
      const target = harness.nodes.find((candidate) => candidate.id === edge.target);
      const artifacts = edge.handoff?.transferredArtifacts ?? [];
      const conditions = edge.handoff?.conditions ?? [];
      const parts = [
        `to "${target?.name ?? edge.target}"`,
        artifacts.length > 0 ? `hand off: ${artifacts.join(", ")}` : "",
        conditions.length > 0 ? `only when: ${conditions.join(", ")}` : "",
      ].filter(Boolean);
      return parts.join(" — ");
    });

/**
 * Renders the full, self-contained prompt for one workflow step. The result
 * contains {{TASK}} / {{UPSTREAM}} placeholders that each export target
 * substitutes with its own mechanism (slash-command arguments, runtime
 * artifact store, ...).
 */
export function buildNodePromptTemplate(harness: Harness, node: HarnessNode): string {
  const brief = node.promptBrief;
  const contract = node.stepContract;
  const pack = harness.contextPack;

  const constraints = Array.from(
    new Set([...brief.constraints, ...node.constraints, ...pack.reusableConstraints]),
  );
  const validation = brief.validation.length > 0 ? brief.validation : pack.validationCommands;
  const availableContext = [
    ...brief.availableContext,
    ...pack.sourceMap.map((item) => `Source map: ${item}`),
    ...pack.domainNotes.map((item) => `Domain note: ${item}`),
    ...pack.knownRisks.map((item) => `Known risk: ${item}`),
  ];
  const expectedOutput = Array.from(new Set([...brief.output, ...contract.producedArtifacts]));
  const requiredInputs = upstreamArtifactNames(harness, node);
  const handoffs = [...contract.handoffNotes, ...outgoingHandoffs(harness, node)];

  return `# Workflow Step: ${node.name}

You are executing the "${node.name}" step (${nodeTypeLabels[node.type]}) of the harness "${harness.name}".

${nodeRoleInstructions[node.type]}

## Task

${TASK_PLACEHOLDER}

## Step Goal

${brief.goal || node.purpose || "Complete this workflow step for the task above."}
${node.notes ? `\nNotes: ${node.notes}\n` : ""}
## Success Criteria

${bulletList(brief.successCriteria, "The step goal is satisfied and the expected output below is produced.")}

${optionalSection("Required Inputs From Previous Steps", bulletList(requiredInputs))}## Inputs Provided By Previous Steps

${UPSTREAM_PLACEHOLDER}

${optionalSection("Available Context", bulletList(availableContext))}${optionalSection(
    "Project Conventions",
    bulletList(pack.conventions),
  )}${optionalSection("Allowed Actions", bulletList(contract.allowedActions))}## Constraints

${bulletList(constraints, "Keep the change scoped to this step. Follow existing project conventions.")}

## Validation

${bulletList(validation, "Run the smallest relevant build, test, typecheck, lint, or manual check, and report results.")}

${optionalSection("Quality Gates", bulletList(contract.qualityGates))}## Expected Output

${bulletList(expectedOutput, "A concise markdown report of what was done, what was verified, and what is handed to the next step.")}

${optionalSection("Handoff To Next Steps", bulletList(handoffs))}${optionalSection(
    "Failure Modes To Avoid",
    bulletList(contract.failureModes),
  )}## Stop Rules

${bulletList(brief.stopRules, "Stop and report if required inputs are missing, validation cannot run, or continuing would require decisions outside this step's scope.")}
`;
}

export function gateVerdictInstruction(): string {
  return `## Verdict Format (required)

End your response with exactly one fenced verdict block:

\`\`\`verdict
PASS or FAIL
reasons: <one line per reason>
fix: <on FAIL, concrete instructions for the next iteration; on PASS, "none">
\`\`\`
`;
}
