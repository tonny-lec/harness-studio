import { describe, expect, it } from "vitest";
import { buildSampleWorkflow, makeStepBlock, makeWorkflow } from "../test/fixtures";
import { fileSlug, planWorkflow } from "./plan";

describe("fileSlug", () => {
  it("normalizes arbitrary names into bounded, file-safe slugs", () => {
    expect(fileSlug("Implement & Verify!", "step")).toBe("implement-verify");
    expect(fileSlug("  API v2 / draft  ", "step")).toBe("api-v2-draft");
    expect(fileSlug("a".repeat(60), "step")).toBe("a".repeat(40));
  });

  it("falls back when the name contains no usable characters", () => {
    expect(fileSlug("実装する", "generate")).toBe("generate");
    expect(fileSlug("", "review")).toBe("review");
  });
});

describe("planWorkflow", () => {
  it("numbers steps sequentially across plain blocks and loop members", () => {
    const plan = planWorkflow(buildSampleWorkflow());
    expect(plan.steps.map((planned) => planned.number)).toEqual([1, 2, 3, 4]);
    expect(plan.steps.map((planned) => planned.slug)).toEqual([
      "01-research-codebase",
      "02-implement-change",
      "03-verify-change",
      "04-final-review",
    ]);
  });

  it("mirrors the block structure into units", () => {
    const plan = planWorkflow(buildSampleWorkflow());
    expect(plan.units.map((unit) => unit.kind)).toEqual(["step", "loop", "step"]);

    const loop = plan.units[1];
    if (loop.kind !== "loop") {
      throw new Error("expected the second unit to be a loop");
    }
    expect(loop.block.name).toBe("Implement Loop");
    expect(loop.planned.map((planned) => planned.step.id)).toEqual([
      "step-implement",
      "step-verify",
    ]);
  });

  it("uses the step kind as the slug fallback for non-ASCII names", () => {
    const plan = planWorkflow(
      makeWorkflow({ blocks: [makeStepBlock({ kind: "review", name: "レビューする" })] }),
    );
    expect(plan.steps[0].slug).toBe("01-review");
  });
});
