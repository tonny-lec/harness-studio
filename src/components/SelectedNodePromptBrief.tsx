import type { HarnessNode, PromptBrief } from "../types/harness";
import { PromptBriefEditor } from "./PromptBriefEditor";

type SelectedNodePromptBriefProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<PromptBrief>) => void;
};

export function SelectedNodePromptBrief({ node, onChange }: SelectedNodePromptBriefProps) {
  if (!node) {
    return (
      <section className="prompt-brief-panel" aria-label="Selected node prompt brief">
        <div className="panel-heading">
          <h2>Selected Node Prompt Brief</h2>
        </div>
        <p className="helper-text">Select a workflow step to edit its Prompt Brief.</p>
      </section>
    );
  }

  return (
    <PromptBriefEditor
      resetKey={node.id}
      title={`Selected Node Prompt Brief: ${node.name}`}
      helperText="One workflow step represents one prompt. This Prompt Brief belongs to the selected node."
      promptBrief={node.promptBrief}
      onChange={(updates) => onChange(node.id, updates)}
    />
  );
}
