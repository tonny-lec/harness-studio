import { useEffect, useState, type KeyboardEvent } from "react";
import type { HarnessNode, StepContract } from "../types/harness";

type SelectedNodeStepContractProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<StepContract>) => void;
};

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  event.stopPropagation();
};

const draftFromContract = (stepContract: StepContract): Record<keyof StepContract, string> => ({
  requiredInputs: stepContract.requiredInputs.join("\n"),
  producedArtifacts: stepContract.producedArtifacts.join("\n"),
  allowedActions: stepContract.allowedActions.join("\n"),
  qualityGates: stepContract.qualityGates.join("\n"),
  handoffNotes: stepContract.handoffNotes.join("\n"),
  failureModes: stepContract.failureModes.join("\n"),
});

const fieldLabels: Record<keyof StepContract, string> = {
  requiredInputs: "Required Inputs（必要な入力）",
  producedArtifacts: "Produced Artifacts（生成する成果物）",
  allowedActions: "Allowed Actions（許可する操作）",
  qualityGates: "Quality Gates（品質ゲート）",
  handoffNotes: "Handoff Notes（引き継ぎメモ）",
  failureModes: "Failure Modes（失敗・停止条件）",
};

const fieldPlaceholders: Record<keyof StepContract, string> = {
  requiredInputs: "例:\n- ユーザーの依頼内容\n- 対象リポジトリの構造\n- 関連するIssueやチケット",
  producedArtifacts: "例:\n- 調査レポート\n- 影響ファイル一覧\n- 未確認事項",
  allowedActions:
    "例:\n- ファイルを読む\n- リポジトリ内を検索する\n- 破壊的でないコマンドを実行する",
  qualityGates:
    "例:\n- このStepではコード変更をしない\n- 事実と推測を分ける\n- リスクと未確認事項を明示する",
  handoffNotes: "例:\n調査結果、影響範囲、リスクをImplementation Stepへ渡す。",
  failureModes: "例:\n- リポジトリを確認できない場合は停止する\n- タスク範囲が曖昧な場合は質問する",
};

export function SelectedNodeStepContract({ node, onChange }: SelectedNodeStepContractProps) {
  const [drafts, setDrafts] = useState<Record<keyof StepContract, string> | null>(
    node ? draftFromContract(node.stepContract) : null,
  );

  useEffect(() => {
    setDrafts(node ? draftFromContract(node.stepContract) : null);
  }, [node?.id]);

  if (!node || !drafts) {
    return (
      <section
        className="step-contract-panel"
        aria-label="Selected node step contract（選択中NodeのStep Contract）"
      >
        <div className="panel-heading">
          <h2>Selected Node Step Contract（選択中NodeのStep Contract）</h2>
        </div>
        <p className="helper-text">Step Contract を編集するWorkflow Stepを選択してください。</p>
      </section>
    );
  }

  const updateField = (field: keyof StepContract, value: string) => {
    setDrafts((currentDrafts) => ({ ...(currentDrafts ?? drafts), [field]: value }));
    onChange(node.id, { [field]: parseLines(value) });
  };

  return (
    <section
      className="step-contract-panel"
      aria-label="Selected node step contract（選択中NodeのStep Contract）"
    >
      <div className="panel-heading">
        <h2>Selected Node Step Contract（選択中NodeのStep Contract）: {node.name}</h2>
      </div>
      <p className="helper-text">
        このWorkflow Stepが何を受け取り、何を生成し、何を満たして次へ渡すかを定義します。
      </p>
      <div className="step-contract-grid">
        {(Object.keys(fieldLabels) as Array<keyof StepContract>).map((field) => (
          <label key={field}>
            {fieldLabels[field]}
            <textarea
              value={drafts[field]}
              rows={3}
              placeholder={fieldPlaceholders[field]}
              onKeyDown={stopKeyboardPropagation}
              onChange={(event) => updateField(field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
