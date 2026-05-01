import type { HarnessEdge, WorkflowLoop } from "../types/harness";

type LegacyHandoff = {
  kind?: unknown;
  transferredArtifacts?: unknown;
  conditions?: unknown;
  notes?: unknown;
  maxIterations?: unknown;
  stopConditions?: unknown;
  failureBehavior?: unknown;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const createEmptyWorkflowLoop = (id: string): WorkflowLoop => ({
  id,
  name: "New Workflow Loop",
  nodeIds: [],
  entryNodeId: "",
  maxIterations: 3,
  exitConditions: [],
  loopArtifacts: [],
});

export const normalizeWorkflowLoop = (value: unknown): WorkflowLoop | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const loop = value as Partial<Record<keyof WorkflowLoop, unknown>>;

  if (typeof loop.id !== "string" || typeof loop.name !== "string") {
    return null;
  }

  return {
    id: loop.id,
    name: loop.name,
    nodeIds: isStringArray(loop.nodeIds) ? loop.nodeIds : [],
    entryNodeId: typeof loop.entryNodeId === "string" ? loop.entryNodeId : "",
    exitTargetNodeId: typeof loop.exitTargetNodeId === "string" ? loop.exitTargetNodeId : undefined,
    maxIterations:
      typeof loop.maxIterations === "number" && Number.isFinite(loop.maxIterations)
        ? loop.maxIterations
        : 3,
    exitConditions: isStringArray(loop.exitConditions) ? loop.exitConditions : [],
    loopArtifacts: isStringArray(loop.loopArtifacts) ? loop.loopArtifacts : [],
    notes: typeof loop.notes === "string" ? loop.notes : "",
  };
};

export const migrateLegacyLoopEdge = (edge: HarnessEdge): WorkflowLoop | null => {
  const handoff = (edge as unknown as { handoff?: LegacyHandoff }).handoff;

  if (!handoff || handoff.kind !== "loop") {
    return null;
  }

  return {
    id: `loop-${edge.id}`,
    name: `Loop: ${edge.source} -> ${edge.target}`,
    nodeIds: edge.source === edge.target ? [edge.source] : [edge.source, edge.target],
    entryNodeId: edge.target,
    exitTargetNodeId: undefined,
    maxIterations:
      typeof handoff.maxIterations === "number" && Number.isFinite(handoff.maxIterations)
        ? handoff.maxIterations
        : 3,
    exitConditions: isStringArray(handoff.stopConditions) ? handoff.stopConditions : [],
    loopArtifacts: isStringArray(handoff.transferredArtifacts) ? handoff.transferredArtifacts : [],
    notes: typeof handoff.notes === "string" ? handoff.notes : "",
  };
};
