import { describe, expect, it } from "vitest";
import { makeLoopBlock, makeStep, makeStepBlock, makeWorkflow } from "../test/fixtures";
import { validateWorkflow } from "./validateWorkflow";

describe("validateWorkflow", () => {
  it("returns no issues for a well-formed workflow", () => {
    const workflow = makeWorkflow({
      blocks: [
        makeStepBlock({ id: "s-plan", kind: "plan", instruction: "計画を立てる。" }),
        makeLoopBlock(), // gate step + exit condition + filled instructions
      ],
    });
    expect(validateWorkflow(workflow)).toEqual([]);
  });

  it("flags a workflow without blocks as an error", () => {
    const issues = validateWorkflow(makeWorkflow({ blocks: [] }));
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("error");
  });

  it("warns about a blank instruction and points at the step", () => {
    const workflow = makeWorkflow({
      blocks: [makeStepBlock({ id: "s-blank", instruction: "   " })],
    });
    expect(validateWorkflow(workflow)).toEqual([
      expect.objectContaining({ severity: "warning", targetId: "s-blank" }),
    ]);
  });

  it("flags loop structure errors: empty loops and invalid maxIterations", () => {
    const emptyLoop = makeWorkflow({ blocks: [makeLoopBlock({ id: "loop-empty", steps: [] })] });
    expect(validateWorkflow(emptyLoop)).toEqual([
      expect.objectContaining({ severity: "error", targetId: "loop-empty" }),
    ]);

    // NaN compares false against everything, so `< 1` alone would accept it.
    for (const maxIterations of [0, -1, 2.5, Number.NaN]) {
      const workflow = makeWorkflow({ blocks: [makeLoopBlock({ maxIterations })] });
      const issues = validateWorkflow(workflow);
      expect(
        issues.some((issue) => issue.severity === "error" && issue.targetId === "loop-1"),
        `maxIterations=${maxIterations} should be rejected`,
      ).toBe(true);
    }
  });

  it("warns when a loop has neither a gate step nor an exit condition", () => {
    const noExit = makeWorkflow({
      blocks: [
        makeLoopBlock({
          id: "loop-open",
          steps: [makeStep({ id: "ls-1", kind: "generate" })],
          exitCondition: "",
        }),
      ],
    });
    expect(validateWorkflow(noExit)).toEqual([
      expect.objectContaining({ severity: "warning", targetId: "loop-open" }),
    ]);
  });

  it("treats either a gate step or an exit condition as a valid loop exit", () => {
    const gateOnly = makeWorkflow({ blocks: [makeLoopBlock({ exitCondition: "" })] });
    expect(validateWorkflow(gateOnly)).toEqual([]);

    const conditionOnly = makeWorkflow({
      blocks: [
        makeLoopBlock({
          steps: [makeStep({ id: "ls-1", kind: "generate" })],
          exitCondition: "成果物が完成している",
        }),
      ],
    });
    expect(validateWorkflow(conditionOnly)).toEqual([]);
  });

  it("warns about a gate outside a loop but not inside one", () => {
    const outside = makeWorkflow({ blocks: [makeStepBlock({ id: "s-gate", kind: "gate" })] });
    expect(validateWorkflow(outside)).toEqual([
      expect.objectContaining({ severity: "warning", targetId: "s-gate" }),
    ]);

    const inside = makeWorkflow({ blocks: [makeLoopBlock()] });
    expect(validateWorkflow(inside)).toEqual([]);
  });
});
