import type { KeyboardEvent } from "react";
import type { HarnessNode } from "../types/harness";

type NodeEditorProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<Omit<HarnessNode, "id" | "type">>) => void;
  onDelete: (nodeId: string) => void;
};

const stopEditorKeyboardPropagation = (
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  event.stopPropagation();
};

export function NodeEditor({ node, onChange, onDelete }: NodeEditorProps) {
  if (!node) {
    return (
      <aside className="side-panel">
        <h2>Selected Workflow Step</h2>
        <p className="empty-state">
          Select a workflow step to edit its role, notes, and prompt brief.
        </p>
      </aside>
    );
  }

  return (
    <aside className="side-panel">
      <h2>Selected Workflow Step</h2>
      <p className="empty-state">
        Compact properties for the selected workflow step. Edit its Prompt Brief in the main panel.
      </p>
      <label>
        Name
        <input
          value={node.name}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { name: event.target.value })}
        />
      </label>
      <label>
        Type
        <input value={node.type} readOnly onKeyDown={stopEditorKeyboardPropagation} />
      </label>
      <label>
        Node Role
        <textarea
          value={node.purpose}
          rows={4}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { purpose: event.target.value })}
        />
      </label>
      <label>
        Notes
        <textarea
          value={node.notes ?? ""}
          rows={4}
          onKeyDown={stopEditorKeyboardPropagation}
          onChange={(event) => onChange(node.id, { notes: event.target.value })}
        />
      </label>
      <button className="danger-button" type="button" onClick={() => onDelete(node.id)}>
        Delete node
      </button>
    </aside>
  );
}
