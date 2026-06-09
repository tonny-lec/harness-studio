import type { ValidationIssue, Workflow } from "../types/workflow";

/**
 * Lightweight inline validation. Errors block a meaningful run; warnings are
 * quality hints. Issues reference the block id (loop steps point at their
 * step id) so the UI can badge the right card.
 */
export function validateWorkflow(workflow: Workflow): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (severity: "error" | "warning", message: string, targetId?: string) =>
    issues.push({ id: `issue-${issues.length}`, severity, message, targetId });

  if (workflow.blocks.length === 0) {
    push("error", "ステップがありません。最低 1 つのステップを追加してください。");
  }

  const allSteps = workflow.blocks.flatMap((block) =>
    block.type === "step" ? [block.step] : block.steps,
  );

  allSteps.forEach((step) => {
    if (!step.instruction.trim()) {
      push(
        "warning",
        `「${step.name}」の指示が空です。何をするステップか書いてください。`,
        step.id,
      );
    }
  });

  workflow.blocks.forEach((block) => {
    if (block.type !== "loop") {
      return;
    }
    if (block.steps.length === 0) {
      push("error", `ループ「${block.name}」が空です。ステップを追加してください。`, block.id);
    }
    const hasGate = block.steps.some((step) => step.kind === "gate");
    if (!hasGate && !block.exitCondition.trim()) {
      push(
        "warning",
        `ループ「${block.name}」に「チェック」ステップも終了条件もありません。終わりどころが判定できないため、どちらかを設定してください。`,
        block.id,
      );
    }
    if (block.maxIterations < 1) {
      push("error", `ループ「${block.name}」の最大繰り返し回数は 1 以上にしてください。`, block.id);
    }
  });

  const gateOutsideLoop = workflow.blocks.filter(
    (block) => block.type === "step" && block.step.kind === "gate",
  );
  gateOutsideLoop.forEach((block) => {
    if (block.type === "step") {
      push(
        "warning",
        `「${block.step.name}」はループの外にあるチェックです。不合格になるとワークフローはそこで停止します(やり直しが必要ならループに入れてください)。`,
        block.step.id,
      );
    }
  });

  return issues;
}
