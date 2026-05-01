import { Plus } from "lucide-react";
import type { HarnessNodeType } from "../types/harness";

const nodeTypes: HarnessNodeType[] = ["task", "context", "agent", "review", "gate"];

type NodeAddToolbarProps = {
  onAddNode: (nodeType: HarnessNodeType) => void;
};

export function NodeAddToolbar({ onAddNode }: NodeAddToolbarProps) {
  return (
    <section className="node-toolbar" aria-label="Add nodes">
      <span>Add node</span>
      <div>
        {nodeTypes.map((nodeType) => (
          <button
            className="ghost-button compact-button"
            type="button"
            key={nodeType}
            onClick={() => onAddNode(nodeType)}
          >
            <Plus size={16} aria-hidden="true" />
            {nodeType}
          </button>
        ))}
      </div>
    </section>
  );
}
