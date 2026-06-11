import { beforeEach, describe, expect, it } from "vitest";
import { stepKindPresets } from "../data/stepKinds";
import { buildSampleWorkflow } from "../test/fixtures";
import type { LoopBlock, Workflow } from "../types/workflow";
import { useWorkflowStore } from "./workflowStore";

const state = () => useWorkflowStore.getState();

const getWorkflow = (workflowId: string): Workflow => {
  const workflow = state().workflows.find((candidate) => candidate.id === workflowId);
  if (!workflow) {
    throw new Error(`workflow ${workflowId} not found`);
  }
  return workflow;
};

const getLoop = (workflowId: string, blockId: string): LoopBlock => {
  const block = getWorkflow(workflowId).blocks.find((candidate) => candidate.id === blockId);
  if (!block || block.type !== "loop") {
    throw new Error(`loop block ${blockId} not found`);
  }
  return block;
};

describe("workflowStore", () => {
  beforeEach(() => {
    // The store is a module-level singleton seeded with a template; reset it
    // to a known-empty state so each test owns its data.
    useWorkflowStore.setState({ workflows: [], selectedWorkflowId: null });
  });

  it("creates a blank workflow for no/unknown template ids and selects it", () => {
    const id = state().createWorkflow();
    expect(state().selectedWorkflowId).toBe(id);
    expect(getWorkflow(id).blocks).toEqual([]);
    expect(getWorkflow(id).name).toBe("新しいワークフロー");

    const fallbackId = state().createWorkflow("does-not-exist");
    expect(getWorkflow(fallbackId).blocks).toEqual([]);
  });

  it("instantiates a template by id", () => {
    const id = state().createWorkflow("coding");
    const workflow = getWorkflow(id);
    expect(workflow.name).toBe("コード変更ワークフロー");
    expect(workflow.blocks.map((block) => block.type)).toEqual(["step", "step", "loop", "step"]);
  });

  it("imports a workflow under a fresh id and selects it", () => {
    const source = buildSampleWorkflow();
    const id = state().importWorkflow(source);
    expect(id).not.toBe(source.id);
    expect(state().selectedWorkflowId).toBe(id);
    expect(getWorkflow(id).name).toBe(source.name);
    expect(getWorkflow(id).blocks).toEqual(source.blocks);
  });

  it("duplicates a workflow as an independent deep copy", () => {
    const sourceId = state().importWorkflow(buildSampleWorkflow());
    state().duplicateWorkflow(sourceId);

    const copy = state().workflows.find((workflow) => workflow.id !== sourceId);
    if (!copy) {
      throw new Error("copy not found");
    }
    expect(copy.name).toBe("Code Change Workflow のコピー");
    expect(copy.blocks).toEqual(getWorkflow(sourceId).blocks);

    // Editing a step in the copy must not leak into the source (deep clone).
    state().updateStep(copy.id, "step-research", { instruction: "changed" });
    const findInstruction = (workflow: Workflow) =>
      workflow.blocks.flatMap((b) => (b.type === "step" ? [b.step] : b.steps))[0].instruction;
    expect(findInstruction(getWorkflow(copy.id))).toBe("changed");
    expect(findInstruction(getWorkflow(sourceId))).toBe("関連コードを調査する。");
  });

  it("deletes workflows and clears the selection only for the deleted one", () => {
    const first = state().createWorkflow();
    const second = state().createWorkflow();

    state().deleteWorkflow(first);
    expect(state().workflows.map((workflow) => workflow.id)).toEqual([second]);
    expect(state().selectedWorkflowId).toBe(second);

    state().deleteWorkflow(second);
    expect(state().workflows).toEqual([]);
    expect(state().selectedWorkflowId).toBeNull();
  });

  it("adds step blocks at the end or right after a given block", () => {
    const id = state().createWorkflow();
    const first = state().addStepBlock(id, "plan");
    const last = state().addStepBlock(id, "review");
    const inserted = state().addStepBlock(id, "research", first);
    const appended = state().addStepBlock(id, "gate", "no-such-block");

    expect(getWorkflow(id).blocks.map((block) => block.id)).toEqual([
      first,
      inserted,
      last,
      appended,
    ]);

    const block = getWorkflow(id).blocks[0];
    if (block.type !== "step") {
      throw new Error("expected a step block");
    }
    expect(block.step.name).toBe(stepKindPresets.plan.defaultName);
    expect(block.step.instruction).toBe("");
  });

  it("seeds new loop blocks with an implement + gate pair", () => {
    const id = state().createWorkflow();
    const loopId = state().addLoopBlock(id);
    const loop = getLoop(id, loopId);
    expect(loop.steps.map((step) => step.kind)).toEqual(["generate", "gate"]);
    expect(loop.maxIterations).toBe(3);
    expect(loop.exitCondition).toBe("");
  });

  it("reorders blocks within bounds and deletes them", () => {
    const id = state().createWorkflow();
    const a = state().addStepBlock(id, "plan");
    const b = state().addStepBlock(id, "generate");
    const c = state().addStepBlock(id, "review");
    const order = () => getWorkflow(id).blocks.map((block) => block.id);

    state().moveBlock(id, b, "up");
    expect(order()).toEqual([b, a, c]);

    state().moveBlock(id, b, "up"); // already first — no-op
    state().moveBlock(id, c, "down"); // already last — no-op
    expect(order()).toEqual([b, a, c]);

    state().deleteBlock(id, a);
    expect(order()).toEqual([b, c]);
  });

  it("manages steps inside a loop", () => {
    const id = state().createWorkflow();
    const loopId = state().addLoopBlock(id);
    const steps = () => getLoop(id, loopId).steps;

    const added = state().addStepToLoop(id, loopId, "review");
    expect(steps().map((step) => step.kind)).toEqual(["generate", "gate", "review"]);

    state().moveStepInLoop(id, loopId, added, "up");
    expect(steps().map((step) => step.kind)).toEqual(["generate", "review", "gate"]);

    state().deleteStepInLoop(id, loopId, added);
    expect(steps().map((step) => step.kind)).toEqual(["generate", "gate"]);
  });

  it("updates steps, loop settings, and workflow metadata in place", () => {
    const id = state().importWorkflow(buildSampleWorkflow());

    // Top-level step and loop member are reached through the same action.
    state().updateStep(id, "step-research", { instruction: "新しい指示" });
    state().updateStep(id, "step-implement", { name: "Implement v2", kind: "review" });
    const blocks = getWorkflow(id).blocks;
    if (blocks[0].type !== "step" || blocks[1].type !== "loop") {
      throw new Error("unexpected block layout");
    }
    expect(blocks[0].step.instruction).toBe("新しい指示");
    expect(blocks[1].steps[0]).toMatchObject({ name: "Implement v2", kind: "review" });

    state().updateLoop(id, blocks[1].id, { maxIterations: 5, exitCondition: "done" });
    expect(getLoop(id, blocks[1].id)).toMatchObject({ maxIterations: 5, exitCondition: "done" });

    state().updateWorkflowMeta(id, { name: "Renamed", context: "新しい前提" });
    expect(getWorkflow(id)).toMatchObject({ name: "Renamed", context: "新しい前提" });
  });
});
