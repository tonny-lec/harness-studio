import type { Step, Workflow, WorkflowBlock, WorkflowExportJson } from "../types/workflow";

export function buildWorkflowJson(workflow: Workflow): WorkflowExportJson {
  return {
    formatVersion: 2,
    generator: "harness-studio",
    workflow,
  };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const STEP_KINDS = new Set(["plan", "research", "generate", "review", "gate"]);

const parseStep = (value: unknown): Step | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const kind = typeof raw.kind === "string" && STEP_KINDS.has(raw.kind) ? raw.kind : "generate";
  return {
    id: raw.id,
    kind: kind as Step["kind"],
    name: raw.name,
    instruction: typeof raw.instruction === "string" ? raw.instruction : "",
    expectedOutput: typeof raw.expectedOutput === "string" ? raw.expectedOutput : "",
    checklist: isStringArray(raw.checklist) ? raw.checklist : [],
  };
};

const parseBlock = (value: unknown): WorkflowBlock | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string") {
    return null;
  }
  if (raw.type === "step") {
    const step = parseStep(raw.step);
    return step ? { id: raw.id, type: "step", step } : null;
  }
  if (raw.type === "loop") {
    const steps = Array.isArray(raw.steps)
      ? raw.steps.map(parseStep).filter((step): step is Step => step !== null)
      : [];
    return {
      id: raw.id,
      type: "loop",
      name: typeof raw.name === "string" ? raw.name : "繰り返しブロック",
      steps,
      maxIterations:
        typeof raw.maxIterations === "number" && Number.isFinite(raw.maxIterations)
          ? Math.max(1, Math.floor(raw.maxIterations))
          : 3,
      exitCondition: typeof raw.exitCondition === "string" ? raw.exitCondition : "",
    };
  }
  return null;
};

/**
 * Parses a previously exported workflow.json. Returns null when the payload
 * is not a recognizable formatVersion 2 document.
 */
export function parseWorkflowJson(text: string): Workflow | null {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const root = payload as Record<string, unknown>;
  const candidate = (root.formatVersion === 2 ? root.workflow : root) as unknown;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const raw = candidate as Record<string, unknown>;
  if (typeof raw.name !== "string" || !Array.isArray(raw.blocks)) {
    return null;
  }
  return {
    id: typeof raw.id === "string" ? raw.id : "imported",
    name: raw.name,
    description: typeof raw.description === "string" ? raw.description : "",
    context: typeof raw.context === "string" ? raw.context : "",
    blocks: raw.blocks.map(parseBlock).filter((block): block is WorkflowBlock => block !== null),
  };
}
