import { Plus } from "lucide-react";
import type { Harness, HarnessValidationIssue } from "../types/harness";

type HarnessOutlineProps = {
  harness: Harness;
  issues: HarnessValidationIssue[];
  selectedOverview: "harness" | "context" | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLoopId: string | null;
  onSelectHarnessOverview: () => void;
  onSelectContextPack: () => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onSelectLoop: (loopId: string) => void;
  onAddLoop: () => void;
  onOpenValidate: () => void;
  onOpenExport: () => void;
};

const nodeName = (harness: Harness, nodeId: string | undefined) =>
  nodeId ? (harness.nodes.find((node) => node.id === nodeId)?.name ?? "不明なNode") : "未選択";

const loopStatus = (issues: HarnessValidationIssue[], loopId: string) => {
  const loopIssues = issues.filter((issue) => issue.scope === "loop" && issue.targetId === loopId);

  if (loopIssues.some((issue) => issue.severity === "warning" || issue.severity === "error")) {
    return "Needs attention";
  }

  return loopIssues.length > 0 ? "Info" : "OK";
};

export function HarnessOutline({
  harness,
  issues,
  selectedOverview,
  selectedNodeId,
  selectedEdgeId,
  selectedLoopId,
  onSelectHarnessOverview,
  onSelectContextPack,
  onSelectNode,
  onSelectEdge,
  onSelectLoop,
  onAddLoop,
  onOpenValidate,
  onOpenExport,
}: HarnessOutlineProps) {
  const contextPackCount = Object.values(harness.contextPack).reduce(
    (count, items) => count + items.length,
    0,
  );

  return (
    <section className="harness-outline-panel">
      <h2>Harness Outline</h2>

      <section className="outline-section">
        <h3>Harness Overview</h3>
        <button
          className={selectedOverview === "harness" ? "outline-item is-selected" : "outline-item"}
          type="button"
          onClick={onSelectHarnessOverview}
        >
          <span>{harness.name}</span>
          <small>{harness.nodes.length} steps</small>
          <small>{harness.edges.length} connections</small>
          <small>{harness.loops.length} workflow loops</small>
        </button>
      </section>

      <section className="outline-section">
        <h3>Context Pack</h3>
        <button
          className={selectedOverview === "context" ? "outline-item is-selected" : "outline-item"}
          type="button"
          onClick={onSelectContextPack}
        >
          <span>Shared context</span>
          <small>{contextPackCount} reusable items</small>
        </button>
      </section>

      <section className="outline-section">
        <h3>Workflow Steps</h3>
        <div className="outline-list">
          {harness.nodes.map((node) => (
            <button
              className={node.id === selectedNodeId ? "outline-item is-selected" : "outline-item"}
              type="button"
              key={node.id}
              onClick={() => onSelectNode(node.id)}
            >
              <span>{node.name}</span>
              <small>{node.type}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="outline-section">
        <h3>Connections</h3>
        <div className="outline-list">
          {harness.edges.map((edge) => (
            <button
              className={edge.id === selectedEdgeId ? "outline-item is-selected" : "outline-item"}
              type="button"
              key={edge.id}
              onClick={() => onSelectEdge(edge.id)}
            >
              <span>
                {nodeName(harness, edge.source)} → {nodeName(harness, edge.target)}
              </span>
              <small>{edge.handoff?.kind ?? "normal"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="outline-section">
        <div className="outline-heading-row">
          <h3>Workflow Loops</h3>
          <button className="ghost-button compact-button" type="button" onClick={onAddLoop}>
            <Plus size={14} aria-hidden="true" />
            Add
          </button>
        </div>
        <div className="outline-list">
          {harness.loops.map((loop) => (
            <button
              className={loop.id === selectedLoopId ? "outline-item is-selected" : "outline-item"}
              type="button"
              key={loop.id}
              onClick={() => onSelectLoop(loop.id)}
            >
              <span>{loop.name}</span>
              <small>
                {loop.nodeIds.length} nodes / max {loop.maxIterations}
              </small>
              <small>{loopStatus(issues, loop.id)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="outline-section">
        <h3>Validation Issues</h3>
        <button className="outline-item" type="button" onClick={onOpenValidate}>
          <span>{issues.length} issues</span>
          <small>Open Validate</small>
        </button>
      </section>

      <section className="outline-section">
        <h3>Exports</h3>
        <button className="outline-item" type="button" onClick={onOpenExport}>
          <span>Blueprint / Prompts</span>
          <small>Open Export</small>
        </button>
      </section>
    </section>
  );
}
