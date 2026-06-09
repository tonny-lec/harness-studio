import { Trash2 } from "lucide-react";
import type { LoopBlock, Step, Workflow } from "../types/workflow";
import { stepKindOrder, stepKindPresets } from "../data/stepKinds";
import { useWorkflowStore } from "../store/workflowStore";
import type { BuilderSelection } from "./PipelineEditor";

type InspectorProps = {
  workflow: Workflow;
  selection: BuilderSelection;
};

const findStep = (workflow: Workflow, stepId: string): Step | null => {
  for (const block of workflow.blocks) {
    if (block.type === "step" && block.step.id === stepId) {
      return block.step;
    }
    if (block.type === "loop") {
      const found = block.steps.find((step) => step.id === stepId);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const findLoopOfStep = (workflow: Workflow, stepId: string): LoopBlock | null => {
  for (const block of workflow.blocks) {
    if (block.type === "loop" && block.steps.some((step) => step.id === stepId)) {
      return block;
    }
  }
  return null;
};

function StepInspector({ workflow, step }: { workflow: Workflow; step: Step }) {
  const { updateStep } = useWorkflowStore();
  const preset = stepKindPresets[step.kind];
  const insideLoop = findLoopOfStep(workflow, step.id);

  return (
    <div className="inspector-body">
      <h3>ステップの編集</h3>
      {insideLoop && <p className="inspector-note">🔁 「{insideLoop.name}」の中のステップです。</p>}

      <label className="field">
        <span>種類</span>
        <div className="kind-picker">
          {stepKindOrder.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`kind-pick kind-${kind}${step.kind === kind ? " is-active" : ""}`}
              title={stepKindPresets[kind].description}
              onClick={() => updateStep(workflow.id, step.id, { kind })}
            >
              {stepKindPresets[kind].label}
            </button>
          ))}
        </div>
        <small>{preset.description}</small>
      </label>

      <label className="field">
        <span>ステップ名</span>
        <input
          type="text"
          value={step.name}
          onChange={(event) => updateStep(workflow.id, step.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>
          指示 <em className="required-mark">必須</em>
        </span>
        <textarea
          rows={6}
          value={step.instruction}
          placeholder={preset.instructionPlaceholder}
          onChange={(event) =>
            updateStep(workflow.id, step.id, { instruction: event.target.value })
          }
        />
        <small>このステップで何をしてほしいかを、人に頼むつもりで書いてください。</small>
      </label>

      <details className="advanced">
        <summary>詳細設定(任意)</summary>
        <label className="field">
          <span>期待する出力</span>
          <textarea
            rows={3}
            value={step.expectedOutput}
            placeholder={preset.defaultExpectedOutput}
            onChange={(event) =>
              updateStep(workflow.id, step.id, { expectedOutput: event.target.value })
            }
          />
          <small>空欄の場合は種類に応じた標準の出力定義が使われます。</small>
        </label>
        <label className="field">
          <span>成功条件チェックリスト(1 行 1 項目)</span>
          <textarea
            rows={4}
            value={step.checklist.join("\n")}
            placeholder={"例: ビルドが通る\n例: 既存テストがすべて成功する"}
            onChange={(event) =>
              updateStep(workflow.id, step.id, {
                checklist: event.target.value.split("\n"),
              })
            }
          />
        </label>
      </details>
    </div>
  );
}

function LoopInspector({ workflow, loop }: { workflow: Workflow; loop: LoopBlock }) {
  const { updateLoop, deleteBlock } = useWorkflowStore();

  return (
    <div className="inspector-body">
      <h3>繰り返しブロックの編集</h3>
      <p className="inspector-note">
        中のステップを順番に実行し、終了条件を満たすまで繰り返します。不合格の理由は次の試行に自動で引き継がれます。
      </p>

      <label className="field">
        <span>名前</span>
        <input
          type="text"
          value={loop.name}
          onChange={(event) => updateLoop(workflow.id, loop.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>最大繰り返し回数</span>
        <input
          type="number"
          min={1}
          max={10}
          value={loop.maxIterations}
          onChange={(event) =>
            updateLoop(workflow.id, loop.id, {
              maxIterations: Math.max(1, Math.floor(Number(event.target.value) || 1)),
            })
          }
        />
        <small>上限に達したら「未解決」として記録し、次のステップへ進みます。</small>
      </label>

      <label className="field">
        <span>終了条件</span>
        <textarea
          rows={3}
          value={loop.exitCondition}
          placeholder="例: テストがすべて成功し、完了条件を満たしている"
          onChange={(event) =>
            updateLoop(workflow.id, loop.id, { exitCondition: event.target.value })
          }
        />
        <small>
          ループ内に「チェック」ステップがある場合はその判定が優先されます。どちらも無いと 1
          回で抜けてしまうので注意してください。
        </small>
      </label>

      <button
        type="button"
        className="danger-button"
        onClick={() => deleteBlock(workflow.id, loop.id)}
      >
        <Trash2 size={15} aria-hidden="true" />
        ループごと削除
      </button>
    </div>
  );
}

function WorkflowInspector({ workflow }: { workflow: Workflow }) {
  const { updateWorkflowMeta } = useWorkflowStore();

  return (
    <div className="inspector-body">
      <h3>ワークフロー設定</h3>
      <p className="inspector-note">左のステップをクリックすると、そのステップを編集できます。</p>

      <label className="field">
        <span>名前</span>
        <input
          type="text"
          value={workflow.name}
          onChange={(event) => updateWorkflowMeta(workflow.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>説明</span>
        <textarea
          rows={2}
          value={workflow.description}
          placeholder="このワークフローが何をするものか"
          onChange={(event) => updateWorkflowMeta(workflow.id, { description: event.target.value })}
        />
      </label>

      <label className="field">
        <span>共有コンテキスト</span>
        <textarea
          rows={6}
          value={workflow.context}
          placeholder={
            "全ステップに共通で伝えたい前提・規約・制約。\n例: 対象リポジトリの規約に従う。変更は必要な範囲に留める。"
          }
          onChange={(event) => updateWorkflowMeta(workflow.id, { context: event.target.value })}
        />
        <small>
          プロジェクトの前提知識・規約・やってはいけないこと等。書き出し時に AGENTS.md / CLAUDE.md
          と各ステップのプロンプトに反映されます。
        </small>
      </label>
    </div>
  );
}

export function Inspector({ workflow, selection }: InspectorProps) {
  if (selection?.type === "step") {
    const step = findStep(workflow, selection.stepId);
    if (step) {
      return <StepInspector workflow={workflow} step={step} />;
    }
  }
  if (selection?.type === "loop") {
    const loop = workflow.blocks.find(
      (block): block is LoopBlock => block.type === "loop" && block.id === selection.blockId,
    );
    if (loop) {
      return <LoopInspector workflow={workflow} loop={loop} />;
    }
  }
  return <WorkflowInspector workflow={workflow} />;
}
