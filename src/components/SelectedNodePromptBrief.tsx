import type { HarnessNode, PromptBrief } from "../types/harness";
import { PromptBriefEditor } from "./PromptBriefEditor";

type SelectedNodePromptBriefProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<PromptBrief>) => void;
};

export function SelectedNodePromptBrief({ node, onChange }: SelectedNodePromptBriefProps) {
  if (!node) {
    return (
      <section
        className="prompt-brief-panel"
        aria-label="Selected node prompt brief（選択中NodeのPrompt Brief）"
      >
        <div className="panel-heading">
          <h2>Selected Node Prompt Brief（選択中NodeのPrompt Brief）</h2>
        </div>
        <p className="helper-text">Prompt Brief を編集するWorkflow Stepを選択してください。</p>
      </section>
    );
  }

  return (
    <PromptBriefEditor
      resetKey={node.id}
      title={`Selected Node Prompt Brief（選択中NodeのPrompt Brief）: ${node.name}`}
      helperText="このWorkflow StepでCodexに何を依頼するかを定義します。1つのNodeは1つのPromptに対応します。"
      promptBrief={node.promptBrief}
      onChange={(updates) => onChange(node.id, updates)}
    />
  );
}
