import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { ContextPack } from "../types/harness";

type ContextPackEditorProps = {
  harnessId: string;
  contextPack: ContextPack;
  onChange: (updates: Partial<ContextPack>) => void;
};

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  event.stopPropagation();
};

const draftFromPack = (contextPack: ContextPack): Record<keyof ContextPack, string> => ({
  projectFacts: contextPack.projectFacts.join("\n"),
  domainNotes: contextPack.domainNotes.join("\n"),
  sourceMap: contextPack.sourceMap.join("\n"),
  conventions: contextPack.conventions.join("\n"),
  reusableConstraints: contextPack.reusableConstraints.join("\n"),
  validationCommands: contextPack.validationCommands.join("\n"),
  knownRisks: contextPack.knownRisks.join("\n"),
});

const fieldLabels: Record<keyof ContextPack, string> = {
  projectFacts: "Project Facts",
  domainNotes: "Domain Notes",
  sourceMap: "Source Map",
  conventions: "Conventions",
  reusableConstraints: "Reusable Constraints",
  validationCommands: "Validation Commands",
  knownRisks: "Known Risks",
};

const fieldPlaceholders: Record<keyof ContextPack, string> = {
  projectFacts:
    "Example:\n- React + TypeScript + Vite frontend\n- Zustand stores harness state\n- localStorage persists drafts",
  domainNotes:
    "Example:\n- A harness represents a reusable AI coding-agent workflow\n- Each workflow step has its own Prompt Brief",
  sourceMap:
    "Example:\n- src/store/harnessStore.ts: harness state and persistence\n- src/utils/exportMarkdown.ts: export generation\n- src/components/HarnessCanvas.tsx: React Flow canvas",
  conventions:
    "Example:\n- Keep MVP features frontend-only\n- Prefer simple component boundaries\n- Avoid broad UI redesigns unless requested",
  reusableConstraints:
    "Example:\n- Do not add backend APIs unless explicitly requested\n- Preserve localStorage persistence\n- Do not reintroduce duplicated prompt fields",
  validationCommands:
    "Example:\nnpm run build\nManual check: refresh after editing and confirm data persists",
  knownRisks:
    "Example:\n- Old persisted data may miss new fields\n- React Flow controlled state needs onNodesChange/onEdgesChange",
};

export function ContextPackEditor({ harnessId, contextPack, onChange }: ContextPackEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [drafts, setDrafts] = useState(draftFromPack(contextPack));

  useEffect(() => {
    setDrafts(draftFromPack(contextPack));
  }, [harnessId]);

  const updateField = (field: keyof ContextPack, value: string) => {
    setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
    onChange({ [field]: parseLines(value) });
  };

  return (
    <section className="context-pack-panel" aria-label="Context pack">
      <button
        className="section-toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        {isOpen ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
        <span>Context Pack</span>
      </button>
      <p className="helper-text">
        Reusable project and domain knowledge. Keep task-specific instructions in workflow step Prompt Briefs.
      </p>
      {isOpen && (
        <div className="context-pack-grid">
          {(Object.keys(fieldLabels) as Array<keyof ContextPack>).map((field) => (
            <label key={field}>
              {fieldLabels[field]}
              <textarea
                value={drafts[field]}
                rows={3}
                placeholder={fieldPlaceholders[field]}
                onKeyDown={stopKeyboardPropagation}
                onChange={(event) => updateField(field, event.target.value)}
              />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
