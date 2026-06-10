import type { Workflow } from "../types/workflow";
import { stepKindPresets } from "../data/stepKinds";
import type { ExportBundle, ExportFile } from "./bundleTypes";
import {
  fileSlug,
  planWorkflow,
  type PlannedStep,
  type PlannedUnit,
  type WorkflowPlan,
} from "./plan";
import {
  buildStepPromptTemplate,
  gateVerdictTextInstruction,
  TASK_PLACEHOLDER,
  UPSTREAM_PLACEHOLDER,
} from "./stepPrompt";
import { buildWorkflowJson } from "./workflowJson";

const ARTIFACT_DIR = ".harness/runs/current";

const commandName = (planned: PlannedStep) => `harness-step-${planned.slug}`;
const artifactFile = (planned: PlannedStep) => `${ARTIFACT_DIR}/${planned.slug}.md`;

const upstreamInstruction = (previous: PlannedStep[]): string => {
  if (previous.length === 0) {
    return "This is the first step. There are no upstream outputs; work from the task and the repository itself.";
  }
  const lines = previous.map(
    (planned) =>
      `- \`${artifactFile(planned)}\` — output of step ${planned.number} "${planned.step.name}"`,
  );
  return `Read the outputs of the previous steps before starting:\n\n${lines.join(
    "\n",
  )}\n\nIf a file is missing, ask the user for that step's output or run the corresponding step command first.`;
};

const stepCommandFile = (
  workflow: Workflow,
  allSteps: PlannedStep[],
  planned: PlannedStep,
): ExportFile => {
  const previous = allSteps.filter((candidate) => candidate.number < planned.number);
  // Function replacements keep "$&"-style sequences in user-authored text literal.
  let prompt = buildStepPromptTemplate(workflow, planned.step)
    .replace(
      TASK_PLACEHOLDER,
      () =>
        "$ARGUMENTS\n\nIf no task was passed as an argument, ask the user for the task before doing anything else.",
    )
    .replace(UPSTREAM_PLACEHOLDER, () => upstreamInstruction(previous));

  if (planned.step.kind === "gate") {
    prompt += `\n${gateVerdictTextInstruction()}`;
  }

  prompt += `\n## Record Your Output

When you finish this step, write your complete output to \`${artifactFile(planned)}\` (create the directory if needed) so later steps can consume it.\n`;

  return {
    path: `.claude/commands/${commandName(planned)}.md`,
    content: `---
description: "Step ${planned.number}/${allSteps.length} of workflow '${workflow.name}': ${planned.step.name}"
argument-hint: <task description>
---

${prompt}`,
  };
};

const planOutline = (plan: WorkflowPlan): string => {
  const lines: string[] = [];
  plan.units.forEach((unit) => {
    if (unit.kind === "step") {
      lines.push(
        `${unit.planned.number}. **${unit.planned.step.name}** — \`/${commandName(unit.planned)}\``,
      );
      return;
    }
    lines.push(
      [
        `- 🔁 **Loop: ${unit.block.name}** (max ${unit.block.maxIterations} attempts)`,
        ...unit.planned.map(
          (planned) =>
            `   - ${planned.number}. **${planned.step.name}** — \`/${commandName(planned)}\``,
        ),
        unit.block.exitCondition
          ? `   - Exit when: ${unit.block.exitCondition}`
          : "   - Exit when: the loop's gate step returns PASS",
      ].join("\n"),
    );
  });
  return lines.join("\n");
};

const runCommandFile = (workflow: Workflow, plan: WorkflowPlan): ExportFile => {
  const loopUnits = plan.units.filter(
    (unit): unit is Extract<PlannedUnit, { kind: "loop" }> => unit.kind === "loop",
  );
  const loopRules = loopUnits.map(
    (unit) =>
      `Loop "${unit.block.name}": repeat [${unit.planned
        .map((planned) => planned.step.name)
        .join(" → ")}] until ${
        unit.block.exitCondition || "the gate step inside the loop returns PASS"
      }. Hard limit: ${unit.block.maxIterations} attempts. If the limit is reached without satisfying the exit condition, stop the loop, record the unresolved state, and continue with the remaining steps while flagging the result as UNRESOLVED.`,
  );

  // One flat list numbered in one place, so any number of loop rules stays sequential.
  const executionRules = [
    `Create the artifact directory \`${ARTIFACT_DIR}\` if it does not exist. If it already contains artifacts from a previous run, move them to \`.harness/runs/archive-<n>\` first.`,
    `Execute the steps below **in order**. For each step, read its command file in \`.claude/commands/\` and follow it exactly, passing the task above as the argument. Write each step's output to its artifact file before moving on.`,
    `Gate steps end with a \`verdict\` block. On FAIL inside a loop, apply the fix instructions and retry the loop. On FAIL outside a loop, stop and report.`,
    ...loopRules,
    `After the last step, write \`${ARTIFACT_DIR}/run-summary.md\`: what was done, validation results, gate verdicts per attempt, unresolved issues, and follow-ups.`,
  ];

  return {
    path: ".claude/commands/harness-run.md",
    content: `---
description: "Run the full '${workflow.name}' workflow end to end"
argument-hint: <task description>
---

# Run Workflow: ${workflow.name}

${workflow.description || ""}

Execute this workflow for the following task:

$ARGUMENTS

If no task was passed as an argument, ask the user for the task before doing anything else.

## Execution Rules

${executionRules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}

## Execution Plan

${planOutline(plan)}
`,
  };
};

const claudeMd = (workflow: Workflow): ExportFile => ({
  path: "CLAUDE.md",
  content: `# ${workflow.name}

${workflow.description || ""}

${workflow.context ? `## Shared Context\n\n${workflow.context}\n` : ""}
## Workflow

This repository uses the "${workflow.name}" workflow generated by Harness Studio.
Run it with \`/harness-run <task>\`, or run steps individually with the
\`/harness-step-*\` commands. Step outputs live in \`${ARTIFACT_DIR}/\`.
`,
});

const packReadme = (workflow: Workflow, steps: PlannedStep[]): ExportFile => ({
  path: "README.md",
  content: `# ${workflow.name} — Claude Code Pack

Harness Studio で作成したワークフローを、Claude Code のスラッシュコマンドとして
使えるようにしたパックです。

## セットアップ

1. このパックの中身を、対象リポジトリのルートにコピーします
   (既存の \`CLAUDE.md\` がある場合は内容をマージしてください)。
2. リポジトリで \`claude\` を起動します。

## 使い方

\`\`\`
/harness-run <タスクの説明>     # ワークフロー全体を実行
\`\`\`

ステップを個別に実行することもできます:

${steps
  .map(
    (planned) =>
      `- \`/${commandName(planned)} <タスク>\` — ${planned.step.name}(${stepKindPresets[planned.step.kind].label})`,
  )
  .join("\n")}

各ステップの成果物は \`${ARTIFACT_DIR}/\` に保存され、後続ステップが読み込みます。

Generated by Harness Studio.
`,
});

export function buildClaudeCodePack(workflow: Workflow): ExportBundle {
  const plan = planWorkflow(workflow);

  const files: ExportFile[] = [
    packReadme(workflow, plan.steps),
    claudeMd(workflow),
    runCommandFile(workflow, plan),
    ...plan.steps.map((planned) => stepCommandFile(workflow, plan.steps, planned)),
    {
      path: "workflow.json",
      content: `${JSON.stringify(buildWorkflowJson(workflow), null, 2)}\n`,
    },
  ];

  return {
    name: `${fileSlug(workflow.name, "workflow")}-claude-code-pack`,
    description:
      "Claude Code にそのまま導入できるパック(CLAUDE.md + ステップ別スラッシュコマンド + オーケストレーター)",
    files,
  };
}
