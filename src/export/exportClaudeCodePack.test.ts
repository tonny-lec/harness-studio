import { describe, expect, it } from "vitest";
import {
  buildSampleWorkflow,
  getFile,
  makeLoopBlock,
  makeStepBlock,
  makeWorkflow,
} from "../test/fixtures";
import { buildClaudeCodePack } from "./exportClaudeCodePack";
import { parseWorkflowJson } from "./workflowJson";

describe("buildClaudeCodePack", () => {
  it("produces the pack contract: CLAUDE.md, orchestrator, one command per step", () => {
    const bundle = buildClaudeCodePack(buildSampleWorkflow());

    expect(bundle.name).toBe("code-change-workflow-claude-code-pack");
    expect(bundle.files.map((file) => file.path).sort()).toEqual(
      [
        ".claude/commands/harness-run.md",
        ".claude/commands/harness-step-01-research-codebase.md",
        ".claude/commands/harness-step-02-implement-change.md",
        ".claude/commands/harness-step-03-verify-change.md",
        ".claude/commands/harness-step-04-final-review.md",
        "CLAUDE.md",
        "README.md",
        "workflow.json",
      ].sort(),
    );
  });

  it("resolves every placeholder in step commands to Claude Code mechanisms", () => {
    const bundle = buildClaudeCodePack(buildSampleWorkflow());
    const commands = bundle.files.filter((file) =>
      file.path.startsWith(".claude/commands/harness-step-"),
    );
    expect(commands).toHaveLength(4);
    for (const command of commands) {
      // {{TASK}} becomes $ARGUMENTS; {{UPSTREAM}} becomes artifact-file reads.
      expect(command.content).toContain("$ARGUMENTS");
      expect(command.content).not.toContain("{{TASK}}");
      expect(command.content).not.toContain("{{UPSTREAM}}");
      expect(command.content).toContain("## Record Your Output");
    }

    const first = getFile(bundle, ".claude/commands/harness-step-01-research-codebase.md");
    expect(first).toContain(
      "description: \"Step 1/4 of workflow 'Code Change Workflow': Research Codebase\"",
    );
  });

  it("hands upstream artifacts to later steps and none to the first", () => {
    const bundle = buildClaudeCodePack(buildSampleWorkflow());

    const first = getFile(bundle, ".claude/commands/harness-step-01-research-codebase.md");
    expect(first).toContain("This is the first step.");

    const third = getFile(bundle, ".claude/commands/harness-step-03-verify-change.md");
    expect(third).toContain(".harness/runs/current/01-research-codebase.md");
    expect(third).toContain(".harness/runs/current/02-implement-change.md");
    expect(third).not.toContain("This is the first step.");
  });

  it("appends the verdict format to gate commands only", () => {
    const bundle = buildClaudeCodePack(buildSampleWorkflow());
    expect(getFile(bundle, ".claude/commands/harness-step-03-verify-change.md")).toContain(
      "```verdict",
    );
    expect(getFile(bundle, ".claude/commands/harness-step-02-implement-change.md")).not.toContain(
      "```verdict",
    );
  });

  it("numbers the orchestrator's execution rules sequentially for any number of loops", () => {
    const workflow = makeWorkflow({
      name: "Two Loops",
      blocks: [
        makeStepBlock({ id: "s-plan", kind: "plan", name: "Plan" }, "b-plan"),
        makeLoopBlock({ id: "loop-a", name: "Loop A" }),
        makeLoopBlock({ id: "loop-b", name: "Loop B", exitCondition: "" }),
      ],
    });
    const run = getFile(buildClaudeCodePack(workflow), ".claude/commands/harness-run.md");

    expect(run).toContain('4. Loop "Loop A": repeat [Implement → Verify] until');
    expect(run).toContain('5. Loop "Loop B"');
    expect(run).toContain("6. After the last step");
    // A loop without an explicit condition exits via its gate step.
    expect(run).toContain("until the gate step inside the loop returns PASS");
    // Hard attempt limits make every loop bounded for the orchestrating agent.
    expect(run).toContain("Hard limit: 3 attempts.");
  });

  it("embeds a workflow.json that re-imports losslessly", () => {
    const workflow = buildSampleWorkflow();
    const bundle = buildClaudeCodePack(workflow);
    expect(parseWorkflowJson(getFile(bundle, "workflow.json"))).toEqual(workflow);
  });
});
