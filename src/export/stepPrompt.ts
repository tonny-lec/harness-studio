import type { Step, Workflow } from "../types/workflow";
import { stepKindPresets } from "../data/stepKinds";

/**
 * Placeholders shared by every runnable export target.
 * - {{TASK}}      — the concrete task the user gives at run time.
 * - {{UPSTREAM}}  — outputs handed off from previously executed steps.
 */
export const TASK_PLACEHOLDER = "{{TASK}}";
export const UPSTREAM_PLACEHOLDER = "{{UPSTREAM}}";

const optionalSection = (title: string, body: string): string =>
  body.trim() ? `## ${title}\n\n${body.trim()}\n\n` : "";

/**
 * Renders the full prompt for one step, with {{TASK}} / {{UPSTREAM}}
 * placeholders that each export target substitutes with its own mechanism.
 */
export function buildStepPromptTemplate(workflow: Workflow, step: Step): string {
  const preset = stepKindPresets[step.kind];
  const checklist = step.checklist.map((item) => item.trim()).filter(Boolean);

  return `# Step: ${step.name}

You are executing the step "${step.name}" (${preset.promptLabel}) of the workflow "${workflow.name}".

${preset.roleInstruction}

## Task

${TASK_PLACEHOLDER}

## Instructions For This Step

${step.instruction.trim() || `(No specific instructions were written. Do what the step name "${step.name}" suggests for the task above.)`}

${optionalSection("Shared Context (applies to every step)", workflow.context)}## Inputs From Previous Steps

${UPSTREAM_PLACEHOLDER}

${optionalSection(
  "Success Checklist",
  checklist.map((item) => `- ${item}`).join("\n"),
)}## Expected Output

${step.expectedOutput.trim() || preset.defaultExpectedOutput}
`;
}

export function gateVerdictTextInstruction(): string {
  return `## Verdict Format (required)

End your response with exactly one fenced verdict block:

\`\`\`verdict
PASS or FAIL
reasons: <one line per reason>
fix: <on FAIL, concrete instructions for the next attempt; on PASS, "none">
\`\`\`
`;
}

export function gateVerdictJsonInstruction(): string {
  return `## Response Format

Your final response is parsed as JSON with the fields \`pass\` (boolean), \`reasons\`
(string array), and \`fixInstructions\` (string; concrete instructions for the next
attempt when failing, otherwise an empty string). Judge strictly against the
instructions and checklist above.
`;
}
