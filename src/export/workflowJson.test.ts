import { describe, expect, it } from "vitest";
import { buildSampleWorkflow } from "../test/fixtures";
import { buildWorkflowJson, parseWorkflowJson } from "./workflowJson";

describe("buildWorkflowJson", () => {
  it("wraps the workflow in the formatVersion 2 envelope", () => {
    const workflow = buildSampleWorkflow();
    expect(buildWorkflowJson(workflow)).toEqual({
      formatVersion: 2,
      generator: "harness-studio",
      workflow,
    });
  });
});

describe("parseWorkflowJson", () => {
  it("round-trips an exported workflow without loss", () => {
    const workflow = buildSampleWorkflow();
    const text = JSON.stringify(buildWorkflowJson(workflow), null, 2);
    expect(parseWorkflowJson(text)).toEqual(workflow);
  });

  it("returns null for unparseable or structurally invalid payloads", () => {
    expect(parseWorkflowJson("not json")).toBeNull();
    expect(parseWorkflowJson("42")).toBeNull();
    // formatVersion 2 envelope without a workflow object inside.
    expect(parseWorkflowJson(JSON.stringify({ formatVersion: 2 }))).toBeNull();
    // A workflow needs at least a name and a blocks array.
    expect(parseWorkflowJson(JSON.stringify({ name: "x" }))).toBeNull();
    expect(parseWorkflowJson(JSON.stringify({ blocks: [] }))).toBeNull();
  });

  it("accepts a bare workflow object without the envelope", () => {
    const parsed = parseWorkflowJson(JSON.stringify({ name: "Bare", blocks: [] }));
    expect(parsed).toEqual({
      id: "imported",
      name: "Bare",
      description: "",
      context: "",
      blocks: [],
    });
  });

  it("repairs lenient step fields and drops unrecognizable blocks", () => {
    const parsed = parseWorkflowJson(
      JSON.stringify({
        name: "Lenient",
        blocks: [
          // Unknown kind falls back to "generate"; optional fields get defaults.
          { id: "b1", type: "step", step: { id: "s1", name: "Step", kind: "deploy" } },
          { id: "b2", type: "unknown" },
          { id: "b3", type: "step", step: { name: "missing id" } },
          "garbage",
        ],
      }),
    );
    expect(parsed?.blocks).toEqual([
      {
        id: "b1",
        type: "step",
        step: {
          id: "s1",
          kind: "generate",
          name: "Step",
          instruction: "",
          expectedOutput: "",
          checklist: [],
        },
      },
    ]);
  });

  it("clamps loop maxIterations to a positive integer and defaults missing loop fields", () => {
    const parsed = parseWorkflowJson(
      JSON.stringify({
        name: "Loops",
        blocks: [
          { id: "l1", type: "loop", steps: [], maxIterations: 0.4 },
          { id: "l2", type: "loop", steps: [], maxIterations: "many" },
        ],
      }),
    );
    expect(parsed?.blocks).toMatchObject([
      { type: "loop", name: "繰り返しブロック", maxIterations: 1, exitCondition: "", steps: [] },
      { type: "loop", maxIterations: 3 },
    ]);
  });
});
