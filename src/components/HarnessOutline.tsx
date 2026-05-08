import {
  Cable,
  FileOutput,
  FileText,
  Package,
  Plus,
  Repeat2,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import type { Harness, HarnessValidationIssue } from "../types/harness";

type HarnessOutlineProps = {
  harness: Harness;
  issues: HarnessValidationIssue[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLoopId: string | null;
  onSelectHarnessDetails: () => void;
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
  const loopIssues = issues.filter(
    (issue) => issue.scope === "workflowLoop" && issue.targetId === loopId,
  );

  if (loopIssues.some((issue) => issue.severity === "warning" || issue.severity === "error")) {
    return "Needs attention";
  }

  return loopIssues.length > 0 ? "Info" : "OK";
};

export function HarnessOutline({
  harness,
  issues,
  selectedNodeId,
  selectedEdgeId,
  selectedLoopId,
  onSelectHarnessDetails,
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
      <div className="outline-header">
        <div>
          <h2>Harness Outline</h2>
          <p>構造を選択してCanvasとInspectorを操作します。</p>
        </div>
      </div>

      <section className="outline-section">
        <h3>Harness Overview</h3>
        <button
          className="outline-item outline-item-primary"
          type="button"
          onClick={onSelectHarnessDetails}
        >
          <span>
            <FileText size={15} aria-hidden="true" />
            {harness.name}
          </span>
          <small>{harness.description || "説明なし"}</small>
        </button>
        <div className="outline-metrics" aria-label="Harness summary">
          <span>{harness.nodes.length} steps</span>
          <span>{harness.edges.length} links</span>
          <span>{harness.loops.length} loops</span>
        </div>
      </section>

      <section className="outline-section">
        <h3>Context Pack</h3>
        <button className="outline-item" type="button" onClick={onSelectContextPack}>
          <span>
            <Package size={15} aria-hidden="true" />
            Shared context
          </span>
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
              <span>
                <Workflow size={15} aria-hidden="true" />
                {node.name}
              </span>
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
                <Cable size={15} aria-hidden="true" />
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
              <span>
                <Repeat2 size={15} aria-hidden="true" />
                {loop.name}
              </span>
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
          <span>
            <ShieldAlert size={15} aria-hidden="true" />
            {issues.length} issues
          </span>
          <small>Open Validate</small>
        </button>
      </section>

      <section className="outline-section">
        <h3>Exports</h3>
        <button className="outline-item" type="button" onClick={onOpenExport}>
          <span>
            <FileOutput size={15} aria-hidden="true" />
            Blueprint / Prompts
          </span>
          <small>Open Export</small>
        </button>
      </section>
    </section>
  );
}
