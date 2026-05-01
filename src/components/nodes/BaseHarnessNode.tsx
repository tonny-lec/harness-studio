import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { HarnessNode } from "../../types/harness";

type BaseHarnessNodeProps = NodeProps & {
  data: HarnessNode & {
    loopMembership?: {
      loopNames: string[];
      isInSelectedLoop: boolean;
      isLoopEntry: boolean;
      isLoopExitTarget: boolean;
      selectedLoopName: string;
    };
  };
  tone: "task" | "context" | "agent" | "review" | "gate";
};

export function BaseHarnessNode({ data, selected, tone }: BaseHarnessNodeProps) {
  const loopClass = data.loopMembership?.isInSelectedLoop
    ? "is-in-selected-loop"
    : data.loopMembership?.isLoopExitTarget
      ? "is-loop-exit-target"
      : data.loopMembership?.loopNames.length
        ? "is-in-any-loop"
        : "";
  const loopNames = data.loopMembership?.loopNames ?? [];
  const membershipLabel =
    loopNames.length > 1
      ? `Loops: ${loopNames.length}`
      : loopNames.length === 1
        ? loopNames[0]
        : "";

  return (
    <div
      className={`harness-node harness-node-${tone} ${selected ? "is-selected" : ""} ${loopClass}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="harness-node-type">{data.type}</div>
      {membershipLabel && (
        <div className="harness-node-loop-badge harness-node-loop-membership">
          {membershipLabel}
        </div>
      )}
      {data.loopMembership?.isInSelectedLoop && (
        <div className="harness-node-loop-badge">
          {data.loopMembership.isLoopEntry ? "Loop entry" : "Loop"}
        </div>
      )}
      {!data.loopMembership?.isInSelectedLoop && data.loopMembership?.isLoopExitTarget && (
        <div className="harness-node-loop-badge">Loop exit</div>
      )}
      <div className="harness-node-name">{data.name}</div>
      <p>{data.purpose}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
