import { useEffect, useState, type KeyboardEvent } from "react";
import type { EdgeKind, HarnessEdge, HarnessNode, HandoffContract } from "../types/harness";
import { createEmptyHandoffContract, normalizeHandoffContract } from "../utils/stepContract";

type SelectedConnectionEditorProps = {
  edge: HarnessEdge;
  sourceNode: HarnessNode | null;
  targetNode: HarnessNode | null;
  onChange: (edgeId: string, updates: Partial<HandoffContract>) => void;
};

type DraftFields = Pick<HandoffContract, "transferredArtifacts" | "conditions" | "stopConditions">;

const connectionKindLabels: Record<EdgeKind, string> = {
  normal: "Normal",
  conditional: "Conditional",
  loop: "Loop",
};

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const stopKeyboardPropagation = (
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
) => {
  event.stopPropagation();
};

const getHandoff = (edge: HarnessEdge): HandoffContract =>
  normalizeHandoffContract(edge.handoff) ?? createEmptyHandoffContract();

const draftFromHandoff = (handoff: HandoffContract): Record<keyof DraftFields, string> => ({
  transferredArtifacts: handoff.transferredArtifacts.join("\n"),
  conditions: handoff.conditions.join("\n"),
  stopConditions: handoff.stopConditions.join("\n"),
});

export function SelectedConnectionEditor({
  edge,
  sourceNode,
  targetNode,
  onChange,
}: SelectedConnectionEditorProps) {
  const handoff = getHandoff(edge);
  const [drafts, setDrafts] = useState(draftFromHandoff(handoff));

  useEffect(() => {
    setDrafts(draftFromHandoff(getHandoff(edge)));
  }, [edge.id]);

  const updateLineField = (field: keyof DraftFields, value: string) => {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
    onChange(edge.id, { [field]: parseLines(value) });
  };

  const connectionTitle = `${sourceNode?.name ?? edge.source} -> ${targetNode?.name ?? edge.target}`;

  return (
    <aside className="side-panel">
      <h2>Selected Connection（選択中Connection）</h2>
      <p className="empty-state">{connectionTitle}</p>

      <label>
        Connection Type（接続種別）
        <select
          value={handoff.kind}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(edge.id, { kind: event.target.value as EdgeKind })}
        >
          {(Object.keys(connectionKindLabels) as EdgeKind[]).map((kind) => (
            <option value={kind} key={kind}>
              {connectionKindLabels[kind]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Transferred Artifacts（引き継ぐ成果物）
        <textarea
          value={drafts.transferredArtifacts}
          rows={4}
          placeholder="例:\n- 調査レポート\n- 変更ファイル一覧\n- 検証結果"
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => updateLineField("transferredArtifacts", event.target.value)}
        />
      </label>

      <label>
        Conditions（この接続を使う条件）
        <textarea
          value={drafts.conditions}
          rows={4}
          placeholder="例:\n- 追加実装が必要な場合\n- Reviewで修正指摘が出た場合"
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => updateLineField("conditions", event.target.value)}
        />
      </label>

      <label>
        Stop Conditions（停止条件）
        <textarea
          value={drafts.stopConditions}
          rows={4}
          placeholder="例:\n- npm run build が成功する\n- Review指摘がなくなる\n- 最大反復回数に達する"
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => updateLineField("stopConditions", event.target.value)}
        />
      </label>

      <label>
        Max Iterations（最大反復回数）
        <input
          type="number"
          min={1}
          value={handoff.maxIterations ?? ""}
          placeholder={handoff.kind === "loop" ? "例: 3" : "Loopの場合に設定"}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => {
            const parsedValue = Number.parseInt(event.target.value, 10);

            onChange(edge.id, {
              maxIterations:
                event.target.value === "" || !Number.isFinite(parsedValue)
                  ? undefined
                  : parsedValue,
            });
          }}
        />
      </label>

      <label>
        Failure Behavior（失敗時の扱い）
        <textarea
          value={handoff.failureBehavior ?? ""}
          rows={4}
          placeholder="例:\n収束しない場合は未解決リスクとして報告し、人間の判断を求める。"
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(edge.id, { failureBehavior: event.target.value })}
        />
      </label>

      <label>
        Notes（補足）
        <textarea
          value={handoff.notes}
          rows={4}
          placeholder="例:\nこの接続で渡す前提、注意点、判断基準を書く。"
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(edge.id, { notes: event.target.value })}
        />
      </label>
    </aside>
  );
}
