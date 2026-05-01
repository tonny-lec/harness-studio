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
  successCriteria: "Success Criteria（成功条件）",
  availableContext: "Available Context（利用可能な前提情報）",
  constraints: "Constraints（制約）",
  validation: "Validation（検証）",
  output: "Output（期待する出力）",
  stopRules: "Stop Rules（停止・質問条件）",
};

const fieldPlaceholders: Record<keyof DraftFields, string> = {
  successCriteria:
    "例:\n- 既存の edge を削除できる\n- 削除後にリロードしても edge が復活しない\n- npm run build が成功する",
  availableContext:
    "例:\nこのアプリは React、TypeScript、Zustand、React Flow、localStorage を利用している。",
  constraints:
    "例:\n- backend API は追加しない\n- 既存の localStorage 永続化を壊さない\n- 大きなUI redesign はしない",
  validation: "例:\nnpm run build\n手動確認: edge を削除してリロード後も復活しないことを確認する",
  output: "例:\n変更ファイル、実装内容、検証結果、残っている制約やトレードオフを報告する。",
  stopRules: "例:\n実装方針に影響する情報が不足している場合のみ質問する。",
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
    <section className="prompt-brief-panel" aria-label="Prompt Brief（プロンプト概要）">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {helperText && <p className="helper-text">{helperText}</p>}
      <label className="prompt-brief-goal">
        Goal（目的）
        <textarea
          value={promptBrief.goal}
          rows={3}
          placeholder="例: React Flow の edge を削除できるようにする。"
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
