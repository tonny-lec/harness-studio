import type { ExportBundle } from "../export/bundleTypes";
import type { LoopBlock, Step, StepBlock, Workflow } from "../types/workflow";

/**
 * Deterministic builders for tests.
 *
 * Unlike the app's createId() (random UUIDs), these use explicit ids so tests
 * can assert against them directly. Every builder accepts a partial override,
 * mirroring how the templates in src/data/templates.ts construct workflows.
 */

export const makeStep = (overrides: Partial<Step> = {}): Step => ({
  id: "step-1",
  kind: "generate",
  name: "作業する",
  instruction: "タスクを実装する。",
  expectedOutput: "",
  checklist: [],
  ...overrides,
});

export const makeStepBlock = (step: Partial<Step> = {}, id?: string): StepBlock => {
  const built = makeStep(step);
  return { id: id ?? `block-${built.id}`, type: "step", step: built };
};

export const makeLoopBlock = (overrides: Partial<LoopBlock> = {}): LoopBlock => ({
  id: "loop-1",
  type: "loop",
  name: "実装と検証",
  steps: [
    makeStep({ id: "loop-step-1", kind: "generate", name: "Implement" }),
    makeStep({ id: "loop-step-2", kind: "gate", name: "Verify" }),
  ],
  maxIterations: 3,
  exitCondition: "テストがすべて成功している",
  ...overrides,
});

export const makeWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
  id: "wf-1",
  name: "Sample Workflow",
  description: "",
  context: "",
  blocks: [],
  ...overrides,
});

/**
 * The canonical exporter fixture: research step → loop (implement → gate) →
 * review step. Step names are ASCII so the expected file slugs are predictable
 * (01-research-codebase, 02-implement-change, 03-verify-change,
 * 04-final-review).
 */
export const buildSampleWorkflow = (): Workflow =>
  makeWorkflow({
    id: "wf-sample",
    name: "Code Change Workflow",
    description: "コード変更を調査からレビューまで一貫して行う。",
    context: "リポジトリの規約に従うこと。",
    blocks: [
      makeStepBlock(
        {
          id: "step-research",
          kind: "research",
          name: "Research Codebase",
          instruction: "関連コードを調査する。",
          expectedOutput: "調査メモ",
          checklist: ["関連ファイルを列挙した"],
        },
        "block-research",
      ),
      makeLoopBlock({
        id: "block-loop",
        name: "Implement Loop",
        steps: [
          makeStep({
            id: "step-implement",
            kind: "generate",
            name: "Implement Change",
            instruction: "計画に従って実装する。",
          }),
          makeStep({
            id: "step-verify",
            kind: "gate",
            name: "Verify Change",
            instruction: "完了条件を満たしているか判定する。",
          }),
        ],
        maxIterations: 3,
        exitCondition: "ビルドとテストが通っている",
      }),
      makeStepBlock(
        {
          id: "step-review",
          kind: "review",
          name: "Final Review",
          instruction: "変更全体をレビューする。",
        },
        "block-review",
      ),
    ],
  });

/** Returns the content of the bundle file at `path`, failing the test when absent. */
export const getFile = (bundle: ExportBundle, path: string): string => {
  const file = bundle.files.find((candidate) => candidate.path === path);
  if (!file) {
    throw new Error(`bundle "${bundle.name}" does not contain ${path}`);
  }
  return file.content;
};
