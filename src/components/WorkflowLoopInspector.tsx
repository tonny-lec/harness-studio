import { useEffect, useState, type KeyboardEvent } from "react";
import { Trash2 } from "lucide-react";
import type { HarnessNode, WorkflowLoop } from "../types/harness";

type WorkflowLoopInspectorProps = {
  loop: WorkflowLoop | null;
  nodes: HarnessNode[];
  onChange: (loopId: string, updates: Partial<WorkflowLoop>) => void;
  onDelete: (loopId: string) => void;
};

type DraftFields = Pick<WorkflowLoop, "exitConditions" | "loopArtifacts">;

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

const draftFromLoop = (loop: WorkflowLoop): Record<keyof DraftFields, string> => ({
  exitConditions: loop.exitConditions.join("\n"),
  loopArtifacts: loop.loopArtifacts.join("\n"),
});

const nodeName = (nodes: HarnessNode[], nodeId: string | undefined) =>
  nodeId ? (nodes.find((node) => node.id === nodeId)?.name ?? "不明なNode") : "未選択";

export function WorkflowLoopInspector({
  loop,
  nodes,
  onChange,
  onDelete,
}: WorkflowLoopInspectorProps) {
  const [drafts, setDrafts] = useState<Record<keyof DraftFields, string>>({
    exitConditions: "",
    loopArtifacts: "",
  });

  useEffect(() => {
    if (loop) {
      setDrafts(draftFromLoop(loop));
    }
  }, [loop?.id]);

  if (!loop) {
    return (
      <aside className="side-panel">
        <h2>Selected Workflow Loop（選択中Loop）</h2>
        <p className="empty-state">編集するWorkflow Loopを左のOutlineから選択してください。</p>
      </aside>
    );
  }

  const updateLineField = (field: keyof DraftFields, value: string) => {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
    onChange(loop.id, { [field]: parseLines(value) });
  };

  const updateNodeMembership = (nodeId: string, isIncluded: boolean) => {
    const nodeIds = isIncluded
      ? [...loop.nodeIds, nodeId]
      : loop.nodeIds.filter((currentNodeId) => currentNodeId !== nodeId);

    onChange(loop.id, {
      nodeIds,
      entryNodeId: nodeIds.includes(loop.entryNodeId) ? loop.entryNodeId : (nodeIds[0] ?? ""),
    });
  };

  return (
    <aside className="side-panel">
      <h2>Selected Workflow Loop（選択中Loop）</h2>
      <div className="workflow-loop-selected-summary">
        <span>
          Included: {loop.nodeIds.map((nodeId) => nodeName(nodes, nodeId)).join(" → ") || "なし"}
        </span>
        <span>Entry: {nodeName(nodes, loop.entryNodeId)}</span>
        <span>Exit: {nodeName(nodes, loop.exitTargetNodeId)}</span>
        <span>Max: {loop.maxIterations}</span>
      </div>

      <label>
        Name（名前）
        <input
          value={loop.name}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(loop.id, { name: event.target.value })}
        />
      </label>

      <fieldset className="inspector-fieldset">
        <legend>Included Nodes（Loopに含めるNode）</legend>
        <div className="workflow-loop-checkboxes">
          {nodes.map((node) => (
            <label key={node.id}>
              <input
                type="checkbox"
                checked={loop.nodeIds.includes(node.id)}
                onKeyDown={stopKeyboardPropagation}
                onChange={(event) => updateNodeMembership(node.id, event.target.checked)}
              />
              {node.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Entry Node（開始Node）
        <select
          value={loop.entryNodeId}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(loop.id, { entryNodeId: event.target.value })}
        >
          <option value="">未選択</option>
          {nodes.map((node) => (
            <option value={node.id} key={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Exit Target Node（終了後の遷移先）
        <select
          value={loop.exitTargetNodeId ?? ""}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) =>
            onChange(loop.id, { exitTargetNodeId: event.target.value || undefined })
          }
        >
          <option value="">未選択</option>
          {nodes.map((node) => (
            <option value={node.id} key={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Max Iterations（最大反復回数）
        <input
          type="number"
          min={1}
          required
          value={loop.maxIterations}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => {
            const parsedValue = Number.parseInt(event.target.value, 10);
            onChange(loop.id, {
              maxIterations:
                event.target.value === "" || !Number.isFinite(parsedValue) ? 0 : parsedValue,
            });
          }}
        />
      </label>

      <label>
        Exit Conditions（終了条件）
        <textarea
          value={drafts.exitConditions}
          rows={4}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => updateLineField("exitConditions", event.target.value)}
        />
      </label>

      <label>
        Loop Artifacts（反復で引き継ぐ成果物）
        <textarea
          value={drafts.loopArtifacts}
          rows={4}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => updateLineField("loopArtifacts", event.target.value)}
        />
      </label>

      <label>
        Notes（補足）
        <textarea
          value={loop.notes ?? ""}
          rows={3}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange(loop.id, { notes: event.target.value })}
        />
      </label>

      <button className="danger-button" type="button" onClick={() => onDelete(loop.id)}>
        <Trash2 size={16} aria-hidden="true" />
        Loopを削除
      </button>
    </aside>
  );
}
