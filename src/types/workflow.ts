/**
 * v2 data model — simplicity first.
 *
 * A workflow is an ordered list of blocks. A block is either a single step or
 * a loop that repeats a list of steps until its exit condition is satisfied.
 * The only required input per step is one instruction text; everything else
 * has sensible defaults derived from the step kind.
 */

export type StepKind = "plan" | "research" | "generate" | "review" | "gate";

export type Step = {
  id: string;
  kind: StepKind;
  name: string;
  /** The one field users must fill in: what this step should do. */
  instruction: string;
  /** Optional: what the step should hand to the next step. */
  expectedOutput: string;
  /** Optional: success criteria, one item per line in the editor. */
  checklist: string[];
};

export type StepBlock = {
  id: string;
  type: "step";
  step: Step;
};

export type LoopBlock = {
  id: string;
  type: "loop";
  name: string;
  steps: Step[];
  maxIterations: number;
  /** Plain-language condition for leaving the loop (judged by a gate step or an LLM judge). */
  exitCondition: string;
};

export type WorkflowBlock = StepBlock | LoopBlock;

export type Workflow = {
  id: string;
  name: string;
  description: string;
  /** Shared background for every step: project facts, conventions, constraints. */
  context: string;
  blocks: WorkflowBlock[];
};

export type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  /** Block (or step) the issue points at; undefined = workflow level. */
  targetId?: string;
  message: string;
};

/** Downloadable design file. formatVersion 2 = the block-based model above. */
export type WorkflowExportJson = {
  formatVersion: 2;
  generator: "harness-studio";
  workflow: Workflow;
};
