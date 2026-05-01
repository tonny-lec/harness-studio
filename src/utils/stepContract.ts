import type { HarnessEdge, HarnessNode, HandoffContract, StepContract } from "../types/harness";

export const createEmptyStepContract = (): StepContract => ({
  requiredInputs: [],
  producedArtifacts: [],
  allowedActions: [],
  qualityGates: [],
  handoffNotes: [],
  failureModes: [],
});

export const createEmptyHandoffContract = (): HandoffContract => ({
  kind: "normal",
  transferredArtifacts: [],
  conditions: [],
  notes: "",
});

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const hasStepContractContent = (stepContract: StepContract) =>
  stepContract.requiredInputs.length > 0 ||
  stepContract.producedArtifacts.length > 0 ||
  stepContract.allowedActions.length > 0 ||
  stepContract.qualityGates.length > 0 ||
  stepContract.handoffNotes.length > 0 ||
  stepContract.failureModes.length > 0;

export const normalizeStepContract = (
  value: unknown,
  legacyNode?: Pick<HarnessNode, "inputs" | "outputs" | "constraints">,
): StepContract => {
  const source =
    value && typeof value === "object"
      ? (value as Partial<Record<keyof StepContract, unknown>>)
      : {};
  const normalized = {
    requiredInputs: isStringArray(source.requiredInputs) ? source.requiredInputs : [],
    producedArtifacts: isStringArray(source.producedArtifacts) ? source.producedArtifacts : [],
    allowedActions: isStringArray(source.allowedActions) ? source.allowedActions : [],
    qualityGates: isStringArray(source.qualityGates) ? source.qualityGates : [],
    handoffNotes: isStringArray(source.handoffNotes) ? source.handoffNotes : [],
    failureModes: isStringArray(source.failureModes) ? source.failureModes : [],
  };

  if (!legacyNode || hasStepContractContent(normalized)) {
    return normalized;
  }

  return {
    ...normalized,
    requiredInputs: [...legacyNode.inputs],
    producedArtifacts: [...legacyNode.outputs],
    qualityGates: [...legacyNode.constraints],
  };
};

export const normalizeHandoffContract = (value: unknown): HandoffContract | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const source = value as Partial<Record<keyof HandoffContract, unknown>>;
  const rawKind = (value as { kind?: unknown }).kind;
  const kind =
    rawKind === "conditional" ||
    (rawKind === "loop" && isStringArray(source.conditions) && source.conditions.length > 0)
      ? "conditional"
      : "normal";

  return {
    kind,
    transferredArtifacts: isStringArray(source.transferredArtifacts)
      ? source.transferredArtifacts
      : [],
    conditions: isStringArray(source.conditions) ? source.conditions : [],
    notes: typeof source.notes === "string" ? source.notes : "",
  };
};

export const normalizeEdgeHandoff = (edge: HarnessEdge): HarnessEdge => ({
  ...edge,
  handoff: normalizeHandoffContract(edge.handoff),
});
