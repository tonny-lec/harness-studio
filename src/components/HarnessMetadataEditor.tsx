import type { KeyboardEvent } from "react";
import type { Harness } from "../types/harness";

type HarnessMetadataEditorProps = {
  harness: Harness;
  onChange: (updates: Pick<Partial<Harness>, "name" | "description">) => void;
};

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  event.stopPropagation();
};

export function HarnessMetadataEditor({ harness, onChange }: HarnessMetadataEditorProps) {
  return (
    <section className="metadata-panel" aria-label="Harness metadata">
      <label>
        Harness name
        <input
          value={harness.name}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label>
        Description
        <textarea
          value={harness.description}
          rows={2}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>
    </section>
  );
}
