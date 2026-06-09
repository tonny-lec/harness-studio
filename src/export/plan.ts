import type { LoopBlock, Step, Workflow } from "../types/workflow";

export type PlannedStep = {
  step: Step;
  /** 1-based position across the whole workflow. */
  number: number;
  /** Filesystem-safe identifier, e.g. "03-implement". */
  slug: string;
};

export type PlannedUnit =
  | { kind: "step"; planned: PlannedStep }
  | { kind: "loop"; block: LoopBlock; planned: PlannedStep[] };

export type WorkflowPlan = {
  units: PlannedUnit[];
  steps: PlannedStep[];
};

const FILE_SAFE_PATTERN = /[^a-z0-9-]+/g;

export function fileSlug(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(FILE_SAFE_PATTERN, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback.toLowerCase().replace(FILE_SAFE_PATTERN, "-");
}

/** Blocks are already ordered in the editor, so planning is a direct mapping. */
export function planWorkflow(workflow: Workflow): WorkflowPlan {
  const steps: PlannedStep[] = [];
  let counter = 0;

  const planStep = (step: Step): PlannedStep => {
    counter += 1;
    const numbered = String(counter).padStart(2, "0");
    // Japanese-only names have no ASCII slug; fall back to the step kind.
    const planned: PlannedStep = {
      step,
      number: counter,
      slug: `${numbered}-${fileSlug(step.name, step.kind)}`,
    };
    steps.push(planned);
    return planned;
  };

  const units: PlannedUnit[] = workflow.blocks.map((block) =>
    block.type === "step"
      ? { kind: "step", planned: planStep(block.step) }
      : { kind: "loop", block, planned: block.steps.map(planStep) },
  );

  return { units, steps };
}
