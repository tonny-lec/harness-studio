import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { HarnessNode } from "../../types/harness";

type BaseHarnessNodeProps = NodeProps & {
  data: HarnessNode;
  tone: "task" | "context" | "agent" | "review" | "gate";
};

export function BaseHarnessNode({ data, selected, tone }: BaseHarnessNodeProps) {
  return (
    <div className={`harness-node harness-node-${tone} ${selected ? "is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="harness-node-type">{data.type}</div>
      <div className="harness-node-name">{data.name}</div>
      <p>{data.purpose}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
