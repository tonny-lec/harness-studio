import type { Harness, HarnessNode } from "../types/harness";
import { exportAgentsMd } from "../utils/exportMarkdown";
import type { ExportBundle, ExportFile } from "./bundleTypes";
import {
  buildExecutionPlan,
  buildHarnessExportJson,
  findNode,
  fileSlug,
  type ExecutionPlan,
} from "./executionPlan";
import {
  buildNodePromptTemplate,
  gateVerdictInstruction,
  nodeTypeLabels,
  TASK_PLACEHOLDER,
  UPSTREAM_PLACEHOLDER,
} from "./nodePrompt";

const ARTIFACT_DIR = ".harness/runs/current";

type StepRef = {
  node: HarnessNode;
  stepNumber: number;
  commandName: string;
  artifactFile: string;
};

const buildStepRefs = (harness: Harness, plan: ExecutionPlan): StepRef[] => {
  const orderedIds = plan.units.flatMap((unit) =>
    unit.kind === "node" ? [unit.nodeId] : unit.nodeIds,
  );
  return orderedIds
    .map((nodeId, index) => {
      const node = findNode(harness, nodeId);
      if (!node) {
        return null;
      }
      const stepNumber = index + 1;
      const numbered = String(stepNumber).padStart(2, "0");
      const slug = fileSlug(node.name, node.id);
      return {
        node,
        stepNumber,
        commandName: `harness-step-${numbered}-${slug}`,
        artifactFile: `${ARTIFACT_DIR}/${numbered}-${slug}.md`,
      };
    })
    .filter((ref): ref is StepRef => ref !== null);
};

const upstreamInstruction = (previous: StepRef[]): string => {
  if (previous.length === 0) {
    return "This is the first step. There are no upstream artifacts; work from the task and the repository itself.";
  }
  const lines = previous.map(
    (ref) => `- \`${ref.artifactFile}\` — output of step ${ref.stepNumber} "${ref.node.name}"`,
  );
  return `Read the artifacts produced by the previous steps before starting:\n\n${lines.join(
    "\n",
  )}\n\nIf a file is missing, ask the user for that step's output or run the corresponding step command first.`;
};

const stepCommandFile = (harness: Harness, refs: StepRef[], ref: StepRef): ExportFile => {
  const previous = refs.filter((candidate) => candidate.stepNumber < ref.stepNumber);
  // Function replacements keep "$&"-style sequences in user-authored text literal.
  let prompt = buildNodePromptTemplate(harness, ref.node)
    .replace(
      TASK_PLACEHOLDER,
      () =>
        "$ARGUMENTS\n\nIf no task was passed as an argument, ask the user for the task before doing anything else.",
    )
    .replace(UPSTREAM_PLACEHOLDER, () => upstreamInstruction(previous));

  if (ref.node.type === "gate") {
    prompt += `\n${gateVerdictInstruction()}`;
  }

  prompt += `\n## Record Your Output

When you finish this step, write your complete output to \`${ref.artifactFile}\` (create the directory if needed) so later steps can consume it.\n`;

  return {
    path: `.claude/commands/${ref.commandName}.md`,
    content: `---
description: "Step ${ref.stepNumber}/${refs.length} of harness '${harness.name}': ${ref.node.name} (${nodeTypeLabels[ref.node.type]})"
argument-hint: <task description>
---

${prompt}`,
  };
};

const planOutline = (harness: Harness, plan: ExecutionPlan, refs: StepRef[]): string => {
  const refByNodeId = new Map(refs.map((ref) => [ref.node.id, ref]));
  const lines: string[] = [];
  plan.units.forEach((unit) => {
    if (unit.kind === "node") {
      const ref = refByNodeId.get(unit.nodeId);
      if (ref) {
        lines.push(
          `${ref.stepNumber}. **${ref.node.name}** (${nodeTypeLabels[ref.node.type]}) — \`/${ref.commandName}\``,
        );
      }
      return;
    }
    const memberLines = unit.nodeIds
      .map((nodeId) => refByNodeId.get(nodeId))
      .filter((ref): ref is StepRef => Boolean(ref))
      .map(
        (ref) =>
          `   - ${ref.stepNumber}. **${ref.node.name}** (${nodeTypeLabels[ref.node.type]}) — \`/${ref.commandName}\``,
      );
    const exitTarget = unit.exitTargetNodeId
      ? findNode(harness, unit.exitTargetNodeId)?.name
      : undefined;
    lines.push(
      [
        `- 🔁 **Loop: ${unit.name}** (max ${unit.maxIterations} iterations)`,
        ...memberLines,
        unit.exitConditions.length > 0
          ? `   - Exit when: ${unit.exitConditions.join("; ")}`
          : "   - Exit when: the loop's gate step returns PASS",
        exitTarget ? `   - After exit continue at: ${exitTarget}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  });
  return lines.join("\n");
};

const mermaidId = (nodeId: string) => nodeId.replace(/[^a-zA-Z0-9_]/g, "_");

const mermaidDiagram = (harness: Harness): string => {
  const lines = ["```mermaid", "flowchart LR"];
  const loopMembers = new Set(harness.loops.flatMap((loop) => loop.nodeIds));
  harness.loops.forEach((loop, index) => {
    lines.push(`  subgraph loop${index}["🔁 ${loop.name} (max ${loop.maxIterations})"]`);
    loop.nodeIds.forEach((nodeId) => {
      const node = findNode(harness, nodeId);
      if (node) {
        lines.push(`    ${mermaidId(nodeId)}["${node.name}"]`);
      }
    });
    lines.push("  end");
  });
  harness.nodes
    .filter((node) => !loopMembers.has(node.id))
    .forEach((node) => {
      lines.push(`  ${mermaidId(node.id)}["${node.name}"]`);
    });
  harness.edges.forEach((edge) => {
    const conditional = edge.handoff?.kind === "conditional";
    lines.push(
      `  ${mermaidId(edge.source)} ${conditional ? "-.->" : "-->"} ${mermaidId(edge.target)}`,
    );
  });
  lines.push("```");
  return lines.join("\n");
};

const runCommandFile = (harness: Harness, plan: ExecutionPlan, refs: StepRef[]): ExportFile => {
  const loopRules = plan.units
    .filter((unit) => unit.kind === "loop")
    .map((unit) => {
      if (unit.kind !== "loop") {
        return "";
      }
      const members = unit.nodeIds
        .map((nodeId) => findNode(harness, nodeId)?.name ?? nodeId)
        .join(" → ");
      const exit =
        unit.exitConditions.length > 0
          ? unit.exitConditions.join("; ")
          : "the gate step inside the loop returns PASS";
      return `- Loop "${unit.name}": repeat [${members}] until ${exit}. Hard limit: ${unit.maxIterations} iterations. If the limit is reached without satisfying the exit conditions, stop the loop, record the unresolved state in the run log, and continue with the remaining steps while flagging the result as UNRESOLVED.`;
    })
    .filter(Boolean);

  return {
    path: ".claude/commands/harness-run.md",
    content: `---
description: "Run the full '${harness.name}' harness workflow end to end"
argument-hint: <task description>
---

# Run Harness: ${harness.name}

${harness.description || ""}

Execute this harness workflow for the following task:

$ARGUMENTS

If no task was passed as an argument, ask the user for the task before doing anything else.

## Execution Rules

1. Create the artifact directory \`${ARTIFACT_DIR}\` if it does not exist. If it already contains artifacts from a previous run, move them to \`.harness/runs/archive-<n>\` first.
2. Execute the steps below **in order**. For each step, read its command file in \`.claude/commands/\` and follow it exactly, passing the task above as the argument. Write each step's output to its artifact file before moving on.
3. Steps marked as Quality Gate end with a \`verdict\` block. On FAIL inside a loop, apply the fix instructions and iterate the loop. On FAIL outside a loop, stop and report.
${loopRules.length > 0 ? loopRules.map((rule) => `4. ${rule}`).join("\n") : ""}
${loopRules.length > 0 ? "5" : "4"}. After the last step, write \`${ARTIFACT_DIR}/run-summary.md\`: what was done, validation results, gate verdicts per iteration, unresolved issues, and follow-ups.

## Execution Plan

${planOutline(harness, plan, refs)}

## Workflow Diagram

${mermaidDiagram(harness)}
`,
  };
};

const workflowDoc = (harness: Harness, plan: ExecutionPlan, refs: StepRef[]): ExportFile => ({
  path: "harness/workflow.md",
  content: `# Workflow: ${harness.name}

${harness.description || ""}

## Execution Plan

${planOutline(harness, plan, refs)}

## Diagram

${mermaidDiagram(harness)}

## Machine-Readable Design

The full harness design (context pack, prompt briefs, step contracts, handoff
contracts, loops, and this execution plan) is stored in
\`harness/harness.json\`. Re-import it into Harness Studio or feed it to the
Agent Runner export to execute the same workflow programmatically.
`,
});

const packReadme = (harness: Harness, refs: StepRef[]): ExportFile => ({
  path: "README.md",
  content: `# ${harness.name} — Claude Code Harness Pack

Harness Studio で設計したワークフローを、そのまま Claude Code で使えるようにしたパックです。

## セットアップ

1. このパックの中身を、対象リポジトリのルートにコピーします。
   - \`CLAUDE.md\` … リポジトリ共通のガイダンス(既存の CLAUDE.md がある場合は内容をマージしてください)
   - \`.claude/commands/\` … 各ワークフローステップのスラッシュコマンド
   - \`harness/\` … ワークフロー定義(設計の原本)
2. リポジトリで \`claude\` を起動します。

## 使い方

### ワークフロー全体を実行する

\`\`\`
/harness-run <タスクの説明>
\`\`\`

Claude が実行計画に従って全ステップを順に実行し、ループとゲート判定を処理し、
成果物を \`.harness/runs/current/\` に書き出します。

### ステップを 1 つずつ実行する

${refs.map((ref) => `- \`/${ref.commandName} <タスク>\` — ${ref.node.name}`).join("\n")}

各ステップは前のステップの成果物(\`.harness/runs/current/\`)を読み込んでから作業します。

## 含まれるファイル

| パス | 内容 |
| --- | --- |
| \`CLAUDE.md\` | Context Pack 由来のリポジトリガイダンス |
| \`.claude/commands/harness-run.md\` | ワークフロー全体のオーケストレーター |
| \`.claude/commands/harness-step-*.md\` | 各ステップのプロンプト(Prompt Brief + Step Contract 由来) |
| \`harness/workflow.md\` | 実行計画とワークフロー図 |
| \`harness/harness.json\` | ハーネス設計の機械可読データ(再インポート/プログラム実行用) |

Generated by Harness Studio.
`,
});

export function buildClaudeCodePack(harness: Harness): ExportBundle {
  const plan = buildExecutionPlan(harness);
  const refs = buildStepRefs(harness, plan);

  const files: ExportFile[] = [
    packReadme(harness, refs),
    { path: "CLAUDE.md", content: exportAgentsMd(harness) },
    runCommandFile(harness, plan, refs),
    ...refs.map((ref) => stepCommandFile(harness, refs, ref)),
    workflowDoc(harness, plan, refs),
    {
      path: "harness/harness.json",
      content: `${JSON.stringify(buildHarnessExportJson(harness), null, 2)}\n`,
    },
  ];

  return {
    name: `${fileSlug(harness.name, harness.id)}-claude-code-pack`,
    description:
      "Claude Code にそのまま導入できるパック(CLAUDE.md + ステップ別スラッシュコマンド + オーケストレーター)",
    files,
  };
}
