import type { PromptBrief } from "../types/harness";

export const createEmptyPromptBrief = (): PromptBrief => ({
  goal: "",
  successCriteria: [],
  availableContext: [],
  constraints: [],
  validation: [],
  output: [],
  stopRules: [],
});

export const normalizePromptBrief = (value: unknown): PromptBrief => {
  if (!value || typeof value !== "object") {
    return createEmptyPromptBrief();
  }

  const brief = value as Partial<Record<keyof PromptBrief, unknown>>;
  const arrayField = (field: keyof Omit<PromptBrief, "goal">) =>
    Array.isArray(brief[field]) && brief[field].every((item) => typeof item === "string")
      ? brief[field]
      : [];

  return {
    goal: typeof brief.goal === "string" ? brief.goal : "",
    successCriteria: arrayField("successCriteria"),
    availableContext: arrayField("availableContext"),
    constraints: arrayField("constraints"),
    validation: arrayField("validation"),
    output: arrayField("output"),
    stopRules: arrayField("stopRules"),
  };
};
