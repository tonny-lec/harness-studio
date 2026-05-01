import type { ContextPack } from "../types/harness";
import { ContextPackEditor } from "./ContextPackEditor";

type ContextPackInspectorProps = {
  harnessId: string;
  contextPack: ContextPack;
  onChange: (updates: Partial<ContextPack>) => void;
};

export function ContextPackInspector({
  harnessId,
  contextPack,
  onChange,
}: ContextPackInspectorProps) {
  return (
    <aside className="side-panel">
      <h2>Context Pack（共有前提知識）</h2>
      <p className="empty-state">
        ハーネス全体で再利用するプロジェクト・ドメイン知識を編集します。
      </p>
      <ContextPackEditor
        harnessId={harnessId}
        contextPack={contextPack}
        onChange={onChange}
        defaultOpen
      />
    </aside>
  );
}
