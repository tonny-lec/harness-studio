import type { StepKind } from "../types/workflow";

export type StepKindPreset = {
  /** Short Japanese label shown on cards and buttons. */
  label: string;
  /** English label used inside generated prompts. */
  promptLabel: string;
  /** One-line plain-language explanation for the picker. */
  description: string;
  defaultName: string;
  /** Placeholder / starting text for the instruction field. */
  instructionPlaceholder: string;
  /** Role instruction injected into generated prompts (English). */
  roleInstruction: string;
  /** Default expected output used when the user leaves the field empty. */
  defaultExpectedOutput: string;
};

export const stepKindOrder: StepKind[] = ["plan", "research", "generate", "review", "gate"];

export const stepKindPresets: Record<StepKind, StepKindPreset> = {
  plan: {
    label: "計画",
    promptLabel: "Planning",
    description: "やることを整理して、進め方と完了条件を決める",
    defaultName: "計画を立てる",
    instructionPlaceholder:
      "例: タスクを分析して、必要な作業の一覧・進め方・完了条件をまとめてください。",
    roleInstruction:
      "Turn the task into a concrete, actionable plan: what needs to be done, in what order, and how to tell when it is complete. Do not start the actual work in this step.",
    defaultExpectedOutput:
      "A short plan: work items in order, key decisions, and explicit completion criteria.",
  },
  research: {
    label: "調査",
    promptLabel: "Research",
    description: "必要な情報・資料・コードを集めて整理する",
    defaultName: "調査する",
    instructionPlaceholder:
      "例: このタスクに関係するファイル・既存の実装・制約を調べて、わかったことをまとめてください。",
    roleInstruction:
      "Gather the information later steps need. Separate confirmed facts from assumptions, and list what you could not confirm. Do not make changes in this step.",
    defaultExpectedOutput:
      "Findings organized as: confirmed facts, assumptions, open questions, and pointers to sources.",
  },
  generate: {
    label: "実行",
    promptLabel: "Execution",
    description: "成果物を作る(実装する・書く・生成する)",
    defaultName: "作業する",
    instructionPlaceholder: "例: 計画と調査結果に従って、実際の成果物を作成してください。",
    roleInstruction:
      "Produce the deliverable for this step. Bias toward completing working output; make reasonable assumptions, record them, and follow the plan and findings from previous steps.",
    defaultExpectedOutput: "The deliverable itself, plus brief notes on assumptions made.",
  },
  review: {
    label: "レビュー",
    promptLabel: "Review",
    description: "成果物の問題点を洗い出す(作り直しはしない)",
    defaultName: "レビューする",
    instructionPlaceholder:
      "例: ここまでの成果物をレビューして、問題点を重要度順に指摘してください。",
    roleInstruction:
      "Review the work produced so far. Report findings ordered by severity with concrete references. Clearly separate confirmed problems from risks and suggestions. Do not rewrite the work during review.",
    defaultExpectedOutput:
      "Findings ordered by severity; if nothing blocks, say so explicitly and list residual risks.",
  },
  gate: {
    label: "チェック",
    promptLabel: "Quality Gate",
    description: "合格/不合格を判定する。ループの出口になる",
    defaultName: "チェックする",
    instructionPlaceholder:
      "例: 成果物が完了条件をすべて満たしているか判定してください。満たしていなければ、何を直すべきか具体的に指示してください。",
    roleInstruction:
      "Decide whether the workflow may continue. Evaluate the criteria strictly, then give an explicit PASS or FAIL verdict with reasons and, on FAIL, concrete fix instructions for the next attempt.",
    defaultExpectedOutput: "A PASS/FAIL verdict with reasons and fix instructions when failing.",
  },
};
