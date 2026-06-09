import { Plus, Repeat } from "lucide-react";
import type { StepKind } from "../types/workflow";
import { stepKindOrder, stepKindPresets } from "../data/stepKinds";

type AddStepMenuProps = {
  onAddStep: (kind: StepKind) => void;
  onAddLoop?: () => void;
};

export function AddStepMenu({ onAddStep, onAddLoop }: AddStepMenuProps) {
  return (
    <div className="add-step-menu" role="group" aria-label="ステップを追加">
      {stepKindOrder.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`add-step-button kind-${kind}`}
          title={stepKindPresets[kind].description}
          onClick={() => onAddStep(kind)}
        >
          <Plus size={14} aria-hidden="true" />
          {stepKindPresets[kind].label}
        </button>
      ))}
      {onAddLoop && (
        <button
          type="button"
          className="add-step-button kind-loop"
          title="ステップを繰り返すブロックを追加(合格するまで自動でやり直す)"
          onClick={onAddLoop}
        >
          <Repeat size={14} aria-hidden="true" />
          繰り返し
        </button>
      )}
    </div>
  );
}
