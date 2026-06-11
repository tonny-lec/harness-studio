import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSampleWorkflow, getFile, makeLoopBlock, makeWorkflow } from "../test/fixtures";
import { buildCodexRunnerPack } from "./exportCodexRunnerPack";
import { parseWorkflowJson } from "./workflowJson";

describe("buildCodexRunnerPack", () => {
  it("produces the runner contract: engine, manifest, prompts, and design file", () => {
    const bundle = buildCodexRunnerPack(buildSampleWorkflow());

    expect(bundle.name).toBe("code-change-workflow-codex-runner");
    expect(bundle.files.map((file) => file.path).sort()).toEqual(
      [
        "AGENTS.md",
        "README.md",
        "improve.mjs",
        "manifest.json",
        "package.json",
        "prompts/01-research-codebase.md",
        "prompts/02-implement-change.md",
        "prompts/03-verify-change.md",
        "prompts/04-final-review.md",
        "run.mjs",
        "workflow.json",
      ].sort(),
    );

    const pkg = JSON.parse(getFile(bundle, "package.json"));
    expect(pkg.name).toBe("code-change-workflow-codex-runner");
    expect(pkg.type).toBe("module");
    expect(pkg.dependencies["@openai/codex-sdk"]).toBeDefined();
  });

  it("writes a manifest that mirrors the workflow plan", () => {
    const bundle = buildCodexRunnerPack(buildSampleWorkflow());
    const manifest = JSON.parse(getFile(bundle, "manifest.json"));

    expect(manifest.workflowName).toBe("Code Change Workflow");
    expect(manifest.runner).toEqual({ sandboxMode: "workspace-write", model: null });
    expect(manifest.units).toEqual([
      {
        kind: "step",
        step: {
          stepId: "step-research",
          name: "Research Codebase",
          kind: "research",
          promptFile: "prompts/01-research-codebase.md",
          artifactFile: "01-research-codebase.md",
        },
      },
      {
        kind: "loop",
        name: "Implement Loop",
        maxIterations: 3,
        exitCondition: "ビルドとテストが通っている",
        steps: [
          expect.objectContaining({
            stepId: "step-implement",
            promptFile: "prompts/02-implement-change.md",
          }),
          expect.objectContaining({ stepId: "step-verify", kind: "gate" }),
        ],
      },
      expect.objectContaining({
        kind: "step",
        step: expect.objectContaining({ stepId: "step-review" }),
      }),
    ]);
  });

  it("clamps invalid loop maxIterations to at least 1 in the manifest", () => {
    // Math.max(1, NaN) is NaN, and the generated `iteration <= maxIterations`
    // loop would then never run — so the manifest must hold a positive integer.
    const workflow = makeWorkflow({
      blocks: [
        makeLoopBlock({ id: "loop-nan", maxIterations: Number.NaN }),
        makeLoopBlock({ id: "loop-zero", maxIterations: 0 }),
        makeLoopBlock({ id: "loop-frac", maxIterations: 2.7 }),
      ],
    });
    const manifest = JSON.parse(getFile(buildCodexRunnerPack(workflow), "manifest.json"));
    expect(manifest.units.map((unit: { maxIterations: number }) => unit.maxIterations)).toEqual([
      1, 1, 2,
    ]);
  });

  it("appends the structured verdict contract to gate prompts only", () => {
    const bundle = buildCodexRunnerPack(buildSampleWorkflow());
    const gate = getFile(bundle, "prompts/03-verify-change.md");
    expect(gate).toContain("parsed as JSON");
    expect(gate).toContain("fixInstructions");

    const generate = getFile(bundle, "prompts/02-implement-change.md");
    expect(generate).not.toContain("fixInstructions");
  });

  it("ships an engine that substitutes the placeholders kept in the prompt files", () => {
    const bundle = buildCodexRunnerPack(buildSampleWorkflow());

    // Prompts keep the raw placeholders — substitution happens at run time.
    const prompts = bundle.files.filter((file) => file.path.startsWith("prompts/"));
    expect(prompts).toHaveLength(4);
    for (const prompt of prompts) {
      expect(prompt.content).toContain("{{TASK}}");
      expect(prompt.content).toContain("{{UPSTREAM}}");
    }

    const engine = getFile(bundle, "run.mjs");
    expect(engine).toContain("@openai/codex-sdk");
    expect(engine).toContain("manifest.json");
    expect(engine).toContain('replace("{{TASK}}"');
    expect(engine).toContain('replace("{{UPSTREAM}}"');
  });

  it("embeds a workflow.json that re-imports losslessly", () => {
    const workflow = buildSampleWorkflow();
    const bundle = buildCodexRunnerPack(workflow);
    expect(parseWorkflowJson(getFile(bundle, "workflow.json"))).toEqual(workflow);
  });

  it("emits engine scripts that parse as valid Node.js modules", () => {
    // run.mjs / improve.mjs are emitted as string constants; a syntax slip
    // would otherwise only surface on the user's machine. `node --check`
    // parses without executing.
    const bundle = buildCodexRunnerPack(buildSampleWorkflow());
    const dir = mkdtempSync(path.join(tmpdir(), "harness-runner-"));
    try {
      for (const name of ["run.mjs", "improve.mjs"]) {
        const file = path.join(dir, name);
        writeFileSync(file, getFile(bundle, name));
        expect(() => execFileSync(process.execPath, ["--check", file])).not.toThrow();
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
