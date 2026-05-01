import { Plus } from "lucide-react";
import type { HarnessNodeType } from "../types/harness";

const nodeTypes: HarnessNodeType[] = ["task", "context", "agent", "review", "gate"];

const nodeTypeLabels: Record<HarnessNodeType, string> = {
  task: "Task",
  context: "Context",
  agent: "Agent",
  review: "Review",
  gate: "Gate",
};

type NodeAddToolbarProps = {
  onAddNode: (nodeType: HarnessNodeType) => void;
};

export function NodeAddToolbar({ onAddNode }: NodeAddToolbarProps) {
  return (
    <section className="node-toolbar" aria-label="Nodeを追加">
      <span>Nodeを追加</span>
      <div>
        {nodeTypes.map((nodeType) => (
          <button
            className="ghost-button compact-button"
            type="button"
            key={nodeType}
            onClick={() => onAddNode(nodeType)}
          >
            <Plus size={16} aria-hidden="true" />
            {nodeTypeLabels[nodeType]}
          </button>
        ))}
      </div>
    </section>
  );
}
