import { useEffect, useState, type KeyboardEvent } from "react";
import type { PromptBrief } from "../types/harness";

type PromptBriefEditorProps = {
  resetKey: string;
  title?: string;
  helperText?: string;
  promptBrief: PromptBrief;
  onChange: (updates: Partial<PromptBrief>) => void;
};

type DraftFields = Omit<PromptBrief, "goal">;

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  event.stopPropagation();
};

const draftFromBrief = (promptBrief: PromptBrief): Record<keyof DraftFields, string> => ({
  successCriteria: promptBrief.successCriteria.join("\n"),
  availableContext: promptBrief.availableContext.join("\n"),
  constraints: promptBrief.constraints.join("\n"),
  validation: promptBrief.validation.join("\n"),
  output: promptBrief.output.join("\n"),
  stopRules: promptBrief.stopRules.join("\n"),
});

const fieldLabels: Record<keyof DraftFields, string> = {
  successCriteria: "Success Criteria",
  availableContext: "Available Context",
  constraints: "Constraints",
  validation: "Validation",
  output: "Output",
  stopRules: "Stop Rules",
};

const fieldPlaceholders: Record<keyof DraftFields, string> = {
  successCriteria:
    "Example:\n- Existing edges can be deleted\n- Deleted edges stay deleted after refresh\n- npm run build passes",
  availableContext:
    "Example:\nThe app uses React, TypeScript, Zustand, React Flow, and localStorage persistence.",
  constraints:
    "Example:\n- Do not add backend APIs\n- Do not change routing\n- Preserve existing localStorage behavior",
  validation:
    "Example:\nnpm run build\nManual check: delete an edge, refresh, and confirm it does not return",
  output:
    "Example:\nReport files changed, behavior implemented, validation results, and remaining trade-offs.",
  stopRules:
    "Example:\nAsk only if missing information would materially change the implementation or create risk.",
};

export function PromptBriefEditor({
  resetKey,
  title = "Prompt Brief",
  helperText,
  promptBrief,
  onChange,
}: PromptBriefEditorProps) {
  const [drafts, setDrafts] = useState(draftFromBrief(promptBrief));

  useEffect(() => {
    setDrafts(draftFromBrief(promptBrief));
  }, [resetKey]);

  const updateLineField = (field: keyof DraftFields, value: string) => {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
    onChange({ [field]: parseLines(value) });
  };

  return (
    <section className="prompt-brief-panel" aria-label="Prompt brief">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {helperText && <p className="helper-text">{helperText}</p>}
      <label className="prompt-brief-goal">
        Goal
        <textarea
          value={promptBrief.goal}
          rows={3}
          placeholder="Example: Add edge deletion support to the React Flow canvas."
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange({ goal: event.target.value })}
        />
      </label>
      <div className="prompt-brief-grid">
        {(Object.keys(fieldLabels) as Array<keyof DraftFields>).map((field) => (
          <label key={field}>
            {fieldLabels[field]}
            <textarea
              value={drafts[field]}
              rows={3}
              placeholder={fieldPlaceholders[field]}
              onKeyDown={stopKeyboardPropagation}
              onChange={(event) => updateLineField(field, event.target.value)}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
