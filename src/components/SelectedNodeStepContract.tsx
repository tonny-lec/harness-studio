import { useEffect, useState, type KeyboardEvent } from "react";
import type { HarnessNode, StepContract } from "../types/harness";

type SelectedNodeStepContractProps = {
  node: HarnessNode | null;
  onChange: (nodeId: string, updates: Partial<StepContract>) => void;
};

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  event.stopPropagation();
};

const draftFromContract = (stepContract: StepContract): Record<keyof StepContract, string> => ({
  requiredInputs: stepContract.requiredInputs.join("\n"),
  producedArtifacts: stepContract.producedArtifacts.join("\n"),
  allowedActions: stepContract.allowedActions.join("\n"),
  qualityGates: stepContract.qualityGates.join("\n"),
  handoffNotes: stepContract.handoffNotes.join("\n"),
  failureModes: stepContract.failureModes.join("\n"),
});

const fieldLabels: Record<keyof StepContract, string> = {
  requiredInputs: "Required Inputs",
  producedArtifacts: "Produced Artifacts",
  allowedActions: "Allowed Actions",
  qualityGates: "Quality Gates",
  handoffNotes: "Handoff Notes",
  failureModes: "Failure Modes",
};

const fieldPlaceholders: Record<keyof StepContract, string> = {
  requiredInputs: "Example:\n- User task\n- Relevant source files\n- Context Pack notes",
  producedArtifacts: "Example:\n- Investigation summary\n- Code changes\n- Review findings",
  allowedActions: "Example:\n- Inspect repository files\n- Edit focused frontend code\n- Run npm run build",
  qualityGates: "Example:\n- Build passes\n- Existing behavior is preserved\n- No backend APIs added",
  handoffNotes: "Example:\n- Pass changed files and validation results to review\n- Include unresolved risks",
  failureModes: "Example:\n- Missing repository context\n- Validation command unavailable\n- Ambiguous product decision",
};

export function SelectedNodeStepContract({ node, onChange }: SelectedNodeStepContractProps) {
  const [drafts, setDrafts] = useState<Record<keyof StepContract, string> | null>(
    node ? draftFromContract(node.stepContract) : null,
  );

  useEffect(() => {
    setDrafts(node ? draftFromContract(node.stepContract) : null);
  }, [node?.id]);

  if (!node || !drafts) {
    return (
      <section className="step-contract-panel" aria-label="Selected node step contract">
        <div className="panel-heading">
          <h2>Selected Node Step Contract</h2>
        </div>
        <p className="helper-text">Select a workflow step to edit its Step Contract.</p>
      </section>
    );
  }

  const updateField = (field: keyof StepContract, value: string) => {
    setDrafts((currentDrafts) => ({ ...(currentDrafts ?? drafts), [field]: value }));
    onChange(node.id, { [field]: parseLines(value) });
  };

  return (
    <section className="step-contract-panel" aria-label="Selected node step contract">
      <div className="panel-heading">
        <h2>Selected Node Step Contract: {node.name}</h2>
      </div>
      <p className="helper-text">
        Defines what this workflow step requires, produces, validates, allows, and hands off.
      </p>
      <div className="step-contract-grid">
        {(Object.keys(fieldLabels) as Array<keyof StepContract>).map((field) => (
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
    </section>
  );
}
