import type { NodeProps } from "@xyflow/react";

type LoopRegionData = {
  name: string;
  includedCount: number;
  entryNodeName: string;
  maxIterations: number;
  exitTargetName: string;
  exitConditionSummary: string;
  exitConditionCount: number;
  isSelected: boolean;
};

export function LoopRegionNode({ data }: NodeProps) {
  const loopData = data as LoopRegionData;

  return (
    <div className={`loop-region-node ${loopData.isSelected ? "is-selected" : ""}`}>
      <div className="loop-region-summary">
        <div className="loop-region-title-row">
          <strong>{loopData.name || "Workflow Loop"}</strong>
          <span>max {loopData.maxIterations}</span>
        </div>
        <div className="loop-region-detail-row">
          <span>{loopData.includedCount} steps</span>
          {loopData.entryNodeName && <span>Entry: {loopData.entryNodeName}</span>}
          {loopData.exitTargetName && <span>Exit: {loopData.exitTargetName}</span>}
        </div>
        <div className="loop-region-exit-row">
          <span>
            Exit conditions:{" "}
            {loopData.exitConditionCount > 0 ? loopData.exitConditionCount : "未設定"}
          </span>
          {loopData.exitConditionSummary && <span>{loopData.exitConditionSummary}</span>}
        </div>
      </div>
    </div>
  );
}
