import type { NodeProps } from "@xyflow/react";

type LoopRegionData = {
  name: string;
  maxIterations: number;
  exitTargetName: string;
  isSelected: boolean;
};

export function LoopRegionNode({ data }: NodeProps) {
  const loopData = data as LoopRegionData;

  return (
    <div className={`loop-region-node ${loopData.isSelected ? "is-selected" : ""}`}>
      <div className="loop-region-label">
        <strong>{loopData.name}</strong>
        <span>Loop / max {loopData.maxIterations}</span>
        {loopData.exitTargetName && <span>Exit: {loopData.exitTargetName}</span>}
      </div>
    </div>
  );
}
