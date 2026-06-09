import { AlertTriangle, ArrowDown, ChevronDown, ChevronUp, Repeat, Trash2 } from "lucide-react";
import type { Step, ValidationIssue, Workflow } from "../types/workflow";
import { stepKindPresets } from "../data/stepKinds";
import { useWorkflowStore } from "../store/workflowStore";
import { AddStepMenu } from "./AddStepMenu";

export type BuilderSelection =
  | { type: "step"; stepId: string }
  | { type: "loop"; blockId: string }
  | null;

type PipelineEditorProps = {
  workflow: Workflow;
  issues: ValidationIssue[];
  selection: BuilderSelection;
  onSelect: (selection: BuilderSelection) => void;
};

const instructionPreview = (step: Step): string => {
  const text = step.instruction.trim().split("\n")[0] ?? "";
  if (!text) {
    return "指示が未入力です";
  }
  return text.length > 64 ? `${text.slice(0, 64)}…` : text;
};

export function PipelineEditor({ workflow, issues, selection, onSelect }: PipelineEditorProps) {
  const {
    addStepBlock,
    addLoopBlock,
    moveBlock,
    deleteBlock,
    addStepToLoop,
    moveStepInLoop,
    deleteStepInLoop,
  } = useWorkflowStore();

  const issuesFor = (targetId: string) => issues.filter((issue) => issue.targetId === targetId);

  const stepCard = (
    step: Step,
    controls: { onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void },
  ) => {
    const selected = selection?.type === "step" && selection.stepId === step.id;
    const stepIssues = issuesFor(step.id);
    return (
      <div
        key={step.id}
        className={`step-card kind-${step.kind}${selected ? " is-selected" : ""}`}
        onClick={() => onSelect({ type: "step", stepId: step.id })}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect({ type: "step", stepId: step.id });
          }
        }}
      >
        <div className="step-card-main">
          <span className={`kind-chip kind-${step.kind}`}>{stepKindPresets[step.kind].label}</span>
          <div className="step-card-text">
            <strong>{step.name}</strong>
            <span className={step.instruction.trim() ? "step-preview" : "step-preview is-empty"}>
              {instructionPreview(step)}
            </span>
          </div>
          {stepIssues.length > 0 && (
            <span
              className="issue-badge"
              title={stepIssues.map((issue) => issue.message).join("\n")}
            >
              <AlertTriangle size={14} aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="step-card-actions" onClick={(event) => event.stopPropagation()}>
          <button type="button" title="上へ移動" onClick={controls.onMoveUp}>
            <ChevronUp size={15} aria-hidden="true" />
          </button>
          <button type="button" title="下へ移動" onClick={controls.onMoveDown}>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          <button type="button" title="削除" className="danger" onClick={controls.onDelete}>
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pipeline">
      <div className="pipeline-start">スタート(タスクを受け取る)</div>
      {workflow.blocks.map((block, index) => (
        <div className="pipeline-row" key={block.id}>
          <div className="pipeline-connector">
            <ArrowDown size={16} aria-hidden="true" />
          </div>
          {block.type === "step" ? (
            stepCard(block.step, {
              onMoveUp: () => moveBlock(workflow.id, block.id, "up"),
              onMoveDown: () => moveBlock(workflow.id, block.id, "down"),
              onDelete: () => deleteBlock(workflow.id, block.id),
            })
          ) : (
            <div
              className={`loop-block${
                selection?.type === "loop" && selection.blockId === block.id ? " is-selected" : ""
              }`}
            >
              <div
                className="loop-block-header"
                onClick={() => onSelect({ type: "loop", blockId: block.id })}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect({ type: "loop", blockId: block.id });
                  }
                }}
              >
                <span className="loop-title">
                  <Repeat size={15} aria-hidden="true" />
                  {block.name}
                  <small>最大 {block.maxIterations} 回繰り返し</small>
                </span>
                {issuesFor(block.id).length > 0 && (
                  <span
                    className="issue-badge"
                    title={issuesFor(block.id)
                      .map((issue) => issue.message)
                      .join("\n")}
                  >
                    <AlertTriangle size={14} aria-hidden="true" />
                  </span>
                )}
                <div className="step-card-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    title="上へ移動"
                    onClick={() => moveBlock(workflow.id, block.id, "up")}
                  >
                    <ChevronUp size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="下へ移動"
                    onClick={() => moveBlock(workflow.id, block.id, "down")}
                  >
                    <ChevronDown size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="ループごと削除"
                    className="danger"
                    onClick={() => deleteBlock(workflow.id, block.id)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="loop-block-body">
                {block.steps.map((step) =>
                  stepCard(step, {
                    onMoveUp: () => moveStepInLoop(workflow.id, block.id, step.id, "up"),
                    onMoveDown: () => moveStepInLoop(workflow.id, block.id, step.id, "down"),
                    onDelete: () => deleteStepInLoop(workflow.id, block.id, step.id),
                  }),
                )}
                <AddStepMenu
                  onAddStep={(kind) => {
                    const stepId = addStepToLoop(workflow.id, block.id, kind);
                    onSelect({ type: "step", stepId });
                  }}
                />
              </div>
              <div className="loop-block-footer">
                {block.exitCondition
                  ? `終了条件: ${block.exitCondition}`
                  : "終了条件: ループ内の「チェック」が合格するまで"}
              </div>
            </div>
          )}
          {index === workflow.blocks.length - 1 && null}
        </div>
      ))}
      <div className="pipeline-row">
        <div className="pipeline-connector">
          <ArrowDown size={16} aria-hidden="true" />
        </div>
        <div className="pipeline-add">
          <p>ステップを追加</p>
          <AddStepMenu
            onAddStep={(kind) => {
              const blockId = addStepBlock(workflow.id, kind);
              const added = useWorkflowStore
                .getState()
                .workflows.find((candidate) => candidate.id === workflow.id)
                ?.blocks.find((candidate) => candidate.id === blockId);
              if (added && added.type === "step") {
                onSelect({ type: "step", stepId: added.step.id });
              }
            }}
            onAddLoop={() => {
              const blockId = addLoopBlock(workflow.id);
              onSelect({ type: "loop", blockId });
            }}
          />
        </div>
      </div>
      <div className="pipeline-row">
        <div className="pipeline-connector">
          <ArrowDown size={16} aria-hidden="true" />
        </div>
        <div className="pipeline-end">完了(成果物とサマリーを出力)</div>
      </div>
    </div>
  );
}
