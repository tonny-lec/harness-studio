import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { HarnessNode, WorkflowLoop } from "../types/harness";

type WorkflowLoopEditorProps = {
  loops: WorkflowLoop[];
  nodes: HarnessNode[];
  selectedLoopId: string | null;
  onSelectLoop: (loopId: string | null) => void;
  onAddLoop: () => string | null;
  onUpdateLoop: (loopId: string, updates: Partial<WorkflowLoop>) => void;
  onDeleteLoop: (loopId: string) => void;
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

const emptyDrafts = (): Record<keyof DraftFields, string> => ({
  exitConditions: "",
  loopArtifacts: "",
});

const nodeName = (nodes: HarnessNode[], nodeId: string | undefined) =>
  nodeId ? (nodes.find((node) => node.id === nodeId)?.name ?? "不明なNode") : "未選択";

const loopStatus = (loop: WorkflowLoop, nodes: HarnessNode[]) => {
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (
    loop.nodeIds.length === 0 ||
    !loop.entryNodeId ||
    !nodeIds.has(loop.entryNodeId) ||
    !Number.isInteger(loop.maxIterations) ||
    loop.maxIterations < 1
  ) {
    return { label: "Incomplete", className: "status-incomplete" };
  }

  if (loop.exitConditions.length === 0) {
    return { label: "Needs attention", className: "status-warning" };
  }

  return { label: "OK", className: "status-ok" };
};

export function WorkflowLoopEditor({
  loops,
  nodes,
  selectedLoopId,
  onSelectLoop,
  onAddLoop,
  onUpdateLoop,
  onDeleteLoop,
}: WorkflowLoopEditorProps) {
  const selectedLoop = useMemo(
    () => loops.find((loop) => loop.id === selectedLoopId) ?? null,
    [loops, selectedLoopId],
  );
  const [drafts, setDrafts] = useState(selectedLoop ? draftFromLoop(selectedLoop) : emptyDrafts());

  useEffect(() => {
    if (selectedLoopId && loops.some((loop) => loop.id === selectedLoopId)) {
      return;
    }

    onSelectLoop(loops[0]?.id ?? null);
  }, [loops, selectedLoopId, onSelectLoop]);

  useEffect(() => {
    setDrafts(selectedLoop ? draftFromLoop(selectedLoop) : emptyDrafts());
  }, [selectedLoop?.id]);

  const handleAddLoop = () => {
    const loopId = onAddLoop();

    if (loopId) {
      onSelectLoop(loopId);
    }
  };

  const updateLineField = (field: keyof DraftFields, value: string) => {
    if (!selectedLoop) {
      return;
    }

    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
    onUpdateLoop(selectedLoop.id, { [field]: parseLines(value) });
  };

  const updateNodeMembership = (nodeId: string, isIncluded: boolean) => {
    if (!selectedLoop) {
      return;
    }

    const nodeIds = isIncluded
      ? [...selectedLoop.nodeIds, nodeId]
      : selectedLoop.nodeIds.filter((currentNodeId) => currentNodeId !== nodeId);

    onUpdateLoop(selectedLoop.id, {
      nodeIds,
      entryNodeId: nodeIds.includes(selectedLoop.entryNodeId)
        ? selectedLoop.entryNodeId
        : (nodeIds[0] ?? ""),
    });
  };

  return (
    <section className="workflow-loop-panel">
      <div className="panel-title-row">
        <div>
          <h2>Workflow Loops（反復フロー）</h2>
          <p className="helper-text">
            Harness全体で、複数のWorkflow Stepをどの条件で反復するかを設計します。
          </p>
        </div>
        <button className="ghost-button compact-button" type="button" onClick={handleAddLoop}>
          <Plus size={16} aria-hidden="true" />
          Loopを追加
        </button>
      </div>

      {loops.length === 0 ? (
        <p className="workflow-loop-empty">Workflow Loop はまだありません。</p>
      ) : (
        <div className="workflow-loop-body">
          <div className="workflow-loop-overview" aria-label="Workflow Loop一覧">
            {loops.map((loop) => {
              const status = loopStatus(loop, nodes);
              const includedNames = loop.nodeIds.map((nodeId) => nodeName(nodes, nodeId));

              return (
                <button
                  className={
                    loop.id === selectedLoopId
                      ? "loop-summary-card is-selected"
                      : "loop-summary-card"
                  }
                  type="button"
                  key={loop.id}
                  onClick={() => onSelectLoop(loop.id)}
                >
                  <span className="loop-summary-title">{loop.name || "Unnamed Workflow Loop"}</span>
                  <span className={`loop-status ${status.className}`}>{status.label}</span>
                  <span>{loop.nodeIds.length} nodes</span>
                  {includedNames.length > 0 && (
                    <span className="loop-summary-muted">{includedNames.join(" -> ")}</span>
                  )}
                  <span>Entry: {nodeName(nodes, loop.entryNodeId)}</span>
                  <span>Exit: {nodeName(nodes, loop.exitTargetNodeId)}</span>
                  <span>Max: {loop.maxIterations}</span>
                </button>
              );
            })}
          </div>

          {selectedLoop && (
            <div className="workflow-loop-editor">
              <div className="workflow-loop-selected-summary">
                <span>
                  Included:{" "}
                  {selectedLoop.nodeIds.map((nodeId) => nodeName(nodes, nodeId)).join(" -> ") ||
                    "なし"}
                </span>
                <span>Entry: {nodeName(nodes, selectedLoop.entryNodeId)}</span>
                <span>Exit: {nodeName(nodes, selectedLoop.exitTargetNodeId)}</span>
                <span>Max: {selectedLoop.maxIterations}</span>
              </div>

              <label>
                Name（名前）
                <input
                  value={selectedLoop.name}
                  onKeyDown={stopKeyboardPropagation}
                  onChange={(event) => onUpdateLoop(selectedLoop.id, { name: event.target.value })}
                />
              </label>

              <fieldset>
                <legend>Included Nodes（Loopに含めるNode）</legend>
                <div className="workflow-loop-checkboxes">
                  {nodes.map((node) => (
                    <label key={node.id}>
                      <input
                        type="checkbox"
                        checked={selectedLoop.nodeIds.includes(node.id)}
                        onKeyDown={stopKeyboardPropagation}
                        onChange={(event) => updateNodeMembership(node.id, event.target.checked)}
                      />
                      {node.name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="workflow-loop-grid">
                <label>
                  Entry Node（開始Node）
                  <select
                    value={selectedLoop.entryNodeId}
                    onKeyDown={stopKeyboardPropagation}
                    onChange={(event) =>
                      onUpdateLoop(selectedLoop.id, { entryNodeId: event.target.value })
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
                  Exit Target Node（終了後の遷移先）
                  <select
                    value={selectedLoop.exitTargetNodeId ?? ""}
                    onKeyDown={stopKeyboardPropagation}
                    onChange={(event) =>
                      onUpdateLoop(selectedLoop.id, {
                        exitTargetNodeId: event.target.value || undefined,
                      })
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
                    value={selectedLoop.maxIterations}
                    placeholder="例: 3"
                    onKeyDown={stopKeyboardPropagation}
                    onChange={(event) => {
                      const parsedValue = Number.parseInt(event.target.value, 10);
                      onUpdateLoop(selectedLoop.id, {
                        maxIterations:
                          event.target.value === "" || !Number.isFinite(parsedValue)
                            ? 0
                            : parsedValue,
                      });
                    }}
                  />
                </label>
              </div>

              <div className="workflow-loop-grid">
                <label>
                  Exit Conditions（終了条件）
                  <textarea
                    value={drafts.exitConditions}
                    rows={4}
                    placeholder="例:\n- validation passes\n- max iterations reached"
                    onKeyDown={stopKeyboardPropagation}
                    onChange={(event) => updateLineField("exitConditions", event.target.value)}
                  />
                </label>

                <label>
                  Loop Artifacts（反復で引き継ぐ成果物）
                  <textarea
                    value={drafts.loopArtifacts}
                    rows={4}
                    placeholder="例:\n- Code changes\n- Validation result\n- Fix notes"
                    onKeyDown={stopKeyboardPropagation}
                    onChange={(event) => updateLineField("loopArtifacts", event.target.value)}
                  />
                </label>
              </div>

              <label>
                Notes（補足）
                <textarea
                  value={selectedLoop.notes ?? ""}
                  rows={3}
                  placeholder="例:\nこのLoopを使う意図、例外、判断基準を書く。"
                  onKeyDown={stopKeyboardPropagation}
                  onChange={(event) => onUpdateLoop(selectedLoop.id, { notes: event.target.value })}
                />
              </label>

              <button
                className="danger-button compact-button"
                type="button"
                onClick={() => onDeleteLoop(selectedLoop.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
                Loopを削除
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
