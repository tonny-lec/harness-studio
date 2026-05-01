import type { ContextPack } from "../types/harness";

export const createEmptyContextPack = (): ContextPack => ({
  projectFacts: [],
  domainNotes: [],
  sourceMap: [],
  conventions: [],
  reusableConstraints: [],
  validationCommands: [],
  knownRisks: [],
});

export const normalizeContextPack = (value: unknown): ContextPack => {
  if (!value || typeof value !== "object") {
    return createEmptyContextPack();
  }

  const pack = value as Partial<Record<keyof ContextPack, unknown>>;
  const arrayField = (field: keyof ContextPack) =>
    Array.isArray(pack[field]) && pack[field].every((item) => typeof item === "string")
      ? pack[field]
      : [];

  return {
    projectFacts: arrayField("projectFacts"),
    domainNotes: arrayField("domainNotes"),
    sourceMap: arrayField("sourceMap"),
    conventions: arrayField("conventions"),
    reusableConstraints: arrayField("reusableConstraints"),
    validationCommands: arrayField("validationCommands"),
    knownRisks: arrayField("knownRisks"),
  };
};
