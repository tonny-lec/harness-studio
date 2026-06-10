import { describe, expect, it } from "vitest";
import { stepKindPresets } from "../data/stepKinds";
import { makeStep, makeWorkflow } from "../test/fixtures";
import {
  buildStepPromptTemplate,
  gateVerdictJsonInstruction,
  gateVerdictTextInstruction,
  TASK_PLACEHOLDER,
  UPSTREAM_PLACEHOLDER,
} from "./stepPrompt";

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe("buildStepPromptTemplate", () => {
  it("contains each runtime placeholder exactly once", () => {
    // Every export target substitutes these with its own mechanism, and the
    // generated improve.mjs requires exactly one occurrence of each per prompt.
    const prompt = buildStepPromptTemplate(makeWorkflow(), makeStep());
    expect(count(prompt, TASK_PLACEHOLDER)).toBe(1);
    expect(count(prompt, UPSTREAM_PLACEHOLDER)).toBe(1);
  });

  it("embeds the instruction, workflow name, and the kind's role instruction", () => {
    const prompt = buildStepPromptTemplate(
      makeWorkflow({ name: "My Flow" }),
      makeStep({ kind: "generate", name: "Implement", instruction: "Refactor the parser." }),
    );
    expect(prompt).toContain('the workflow "My Flow"');
    expect(prompt).toContain("Refactor the parser.");
    expect(prompt).toContain(stepKindPresets.generate.roleInstruction);
  });

  it("falls back to an explicit note when the instruction is blank", () => {
    const prompt = buildStepPromptTemplate(makeWorkflow(), makeStep({ instruction: "  " }));
    expect(prompt).toContain("No specific instructions were written");
  });

  it("renders the optional sections only when they have content", () => {
    const bare = buildStepPromptTemplate(
      makeWorkflow({ context: "" }),
      makeStep({ checklist: [] }),
    );
    expect(bare).not.toContain("## Shared Context");
    expect(bare).not.toContain("## Success Checklist");

    const full = buildStepPromptTemplate(
      makeWorkflow({ context: "Follow the style guide." }),
      makeStep({ checklist: ["Build passes", "   ", "Tests pass"] }),
    );
    expect(full).toContain("## Shared Context (applies to every step)\n\nFollow the style guide.");
    // Blank checklist entries (from empty editor lines) are dropped.
    expect(full).toContain("- Build passes\n- Tests pass");
  });

  it("uses the kind's default expected output only when the field is empty", () => {
    const fallback = buildStepPromptTemplate(makeWorkflow(), makeStep({ expectedOutput: "" }));
    expect(fallback).toContain(stepKindPresets.generate.defaultExpectedOutput);

    const custom = buildStepPromptTemplate(
      makeWorkflow(),
      makeStep({ expectedOutput: "A unified diff." }),
    );
    expect(custom).toContain("A unified diff.");
    expect(custom).not.toContain(stepKindPresets.generate.defaultExpectedOutput);
  });
});

describe("gate verdict instructions", () => {
  it("describe the machine-readable verdict formats", () => {
    expect(gateVerdictTextInstruction()).toContain("```verdict");
    expect(gateVerdictTextInstruction()).toContain("PASS or FAIL");

    const json = gateVerdictJsonInstruction();
    expect(json).toContain("`pass`");
    expect(json).toContain("fixInstructions");
  });
});
