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
  projectFacts: "Project Facts（プロジェクトの前提）",
  domainNotes: "Domain Notes（ドメイン知識）",
  sourceMap: "Source Map（ソースマップ）",
  conventions: "Conventions（開発ルール・慣習）",
  reusableConstraints: "Reusable Constraints（再利用する制約）",
  validationCommands: "Validation Commands（検証コマンド）",
  knownRisks: "Known Risks（既知のリスク）",
};

const fieldPlaceholders: Record<keyof ContextPack, string> = {
  projectFacts:
    "例:\n- React + TypeScript + Vite のフロントエンドアプリ\n- Zustand で harness state を管理する\n- localStorage で下書きを永続化する",
  domainNotes:
    "例:\n- Harness はAIコーディングエージェント向けの作業フローを表す\n- 1つのWorkflow Stepは1つのPromptに対応する",
  sourceMap:
    "例:\n- src/store/harnessStore.ts: harness state と永続化\n- src/utils/exportMarkdown.ts: export生成\n- src/components/HarnessCanvas.tsx: React Flow canvas",
  conventions:
    "例:\n- MVPではfrontend-onlyを維持する\n- component boundaryをシンプルに保つ\n- 指示がない限り大きなUI redesignは避ける",
  reusableConstraints:
    "例:\n- 明示されない限りbackend APIは追加しない\n- localStorage persistenceを壊さない\n- Prompt BriefとContext Packを混同しない",
  validationCommands: "例:\nnpm run format:check\nnpm run build",
  knownRisks:
    "例:\n- 古いlocalStorageデータには新しいfieldが存在しない可能性がある\n- React Flowのcontrolled stateではonNodesChange/onEdgesChangeが必要",
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
    <section className="context-pack-panel" aria-label="Context Pack（共有前提知識）">
      <button
        className="section-toggle"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <ChevronDown size={18} aria-hidden="true" />
        ) : (
          <ChevronRight size={18} aria-hidden="true" />
        )}
        <span>Context Pack（共有前提知識）</span>
      </button>
      <p className="helper-text">
        ハーネス全体で共有するプロジェクト・ドメイン知識です。タスク固有の依頼内容は各NodeのPrompt
        Briefに書きます。
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
