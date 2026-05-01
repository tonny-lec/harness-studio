import type { KeyboardEvent, ReactNode } from "react";
import type { HarnessNode } from "../types/harness";

type NodeEditorProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<Omit<HarnessNode, "id" | "type">>) => void;
  onDelete: (nodeId: string) => void;
  children?: ReactNode;
};

const stopEditorKeyboardPropagation = (
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  event.stopPropagation();
};

export function NodeEditor({ node, onChange, onDelete, children }: NodeEditorProps) {
  if (!node) {
    return (
      <aside className="side-panel">
        <h2>Selected Workflow Step（選択中Step）</h2>
        <p className="empty-state">編集するWorkflow Stepを選択してください。</p>
      </aside>
    );
  }

  return (
    <aside className="side-panel">
      <h2>Selected Workflow Step（選択中Step）</h2>
      <p className="empty-state">
        選択中Stepの基本情報だけを編集します。Prompt Briefはメイン領域で編集します。
      </p>
      <label>
        Name（名前）
        <input
          value={node.name}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { name: event.target.value })}
        />
      </label>
      <label>
        Type（種別）
        <input value={node.type} readOnly onKeyDown={stopEditorKeyboardPropagation} />
      </label>
      <label>
        Node Role（このStepの役割）
        <textarea
          value={node.purpose}
          rows={4}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { purpose: event.target.value })}
        />
      </label>
      <label>
        Notes（メモ）
        <textarea
          value={node.notes ?? ""}
          rows={4}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { notes: event.target.value })}
        />
      </label>
      {children}
      <button className="danger-button" type="button" onClick={() => onDelete(node.id)}>
        Nodeを削除
      </button>
    </aside>
  );
}
