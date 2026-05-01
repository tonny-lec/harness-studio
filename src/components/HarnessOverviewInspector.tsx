import type { KeyboardEvent } from "react";
import type { Harness, HarnessValidationIssue } from "../types/harness";

type HarnessOverviewInspectorProps = {
  harness: Harness;
  issues: HarnessValidationIssue[];
  onChange: (updates: Pick<Partial<Harness>, "name" | "description">) => void;
};

const stopKeyboardPropagation = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  event.stopPropagation();
};

export function HarnessOverviewInspector({
  harness,
  issues,
  onChange,
}: HarnessOverviewInspectorProps) {
  return (
    <aside className="side-panel">
      <h2>Harness Overview（ハーネス概要）</h2>
      <p className="empty-state">ハーネス全体の名前、説明、構造サマリーを確認・編集します。</p>

      <label>
        Harness name（ハーネス名）
        <input
          value={harness.name}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>

      <label>
        Description（説明）
        <textarea
          value={harness.description}
          rows={4}
          onKeyDown={stopKeyboardPropagation}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </label>

      <div className="overview-stats" aria-label="Harness summary（ハーネスサマリー）">
        <span>
          <strong>{harness.nodes.length}</strong>
          Workflow Steps
        </span>
        <span>
          <strong>{harness.edges.length}</strong>
          Connections
        </span>
        <span>
          <strong>{harness.loops.length}</strong>
          Workflow Loops
        </span>
        <span>
          <strong>{issues.length}</strong>
          Validation Issues
        </span>
      </div>
    </aside>
  );
}
