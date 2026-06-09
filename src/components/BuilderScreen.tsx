import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Workflow } from "../types/workflow";
import { useWorkflowStore } from "../store/workflowStore";
import { validateWorkflow } from "../utils/validateWorkflow";
import { PipelineEditor, type BuilderSelection } from "./PipelineEditor";
import { Inspector } from "./Inspector";
import { ExportPanel } from "./ExportPanel";

type BuilderTab = "build" | "export";

type BuilderScreenProps = {
  workflow: Workflow;
};

export function BuilderScreen({ workflow }: BuilderScreenProps) {
  const { selectWorkflow } = useWorkflowStore();
  const [tab, setTab] = useState<BuilderTab>("build");
  const [selection, setSelection] = useState<BuilderSelection>(null);

  const issues = useMemo(() => validateWorkflow(workflow), [workflow]);

  return (
    <main className="builder-screen">
      <header className="builder-header">
        <button
          type="button"
          className="ghost-button"
          onClick={() => selectWorkflow(null)}
          aria-label="一覧に戻る"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          一覧
        </button>
        <div className="builder-title">
          <h1>{workflow.name}</h1>
          {workflow.description && <p>{workflow.description}</p>}
        </div>
        <nav className="builder-tabs" aria-label="画面切り替え">
          <button
            type="button"
            className={tab === "build" ? "builder-tab is-active" : "builder-tab"}
            onClick={() => setTab("build")}
          >
            作成
          </button>
          <button
            type="button"
            className={tab === "export" ? "builder-tab is-active" : "builder-tab"}
            onClick={() => setTab("export")}
          >
            書き出し
          </button>
        </nav>
      </header>

      {tab === "build" ? (
        <div className="builder-layout">
          <section
            className="builder-pipeline-panel"
            aria-label="ワークフローのステップ"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setSelection(null);
              }
            }}
          >
            <PipelineEditor
              workflow={workflow}
              issues={issues}
              selection={selection}
              onSelect={setSelection}
            />
          </section>
          <aside className="builder-inspector-panel">
            <Inspector workflow={workflow} selection={selection} />
          </aside>
        </div>
      ) : (
        <div className="builder-export-layout">
          <ExportPanel workflow={workflow} />
        </div>
      )}
    </main>
  );
}
