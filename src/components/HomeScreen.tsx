import { useRef, useState } from "react";
import { Copy, FileUp, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useWorkflowStore } from "../store/workflowStore";
import { workflowTemplates } from "../data/templates";
import { parseWorkflowJson } from "../export/workflowJson";

export function HomeScreen() {
  const {
    workflows,
    selectWorkflow,
    createWorkflow,
    importWorkflow,
    duplicateWorkflow,
    deleteWorkflow,
  } = useWorkflowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const workflow = parseWorkflowJson(text);
    if (!workflow) {
      setImportError("workflow.json として読み込めませんでした。ファイルを確認してください。");
      return;
    }
    setImportError("");
    importWorkflow(workflow);
  };

  return (
    <main className="home-screen">
      <header className="home-header">
        <h1>Harness Studio</h1>
        <p>
          Agentic Workflow を、画面操作だけで。作ったワークフローはそのまま実行できる形で
          ダウンロードできます(Codex Runner / Claude Code Pack)。
        </p>
      </header>

      <section className="home-section">
        <div className="home-section-title">
          <h2>テンプレートから始める</h2>
          <p>まずはテンプレートを開いて、中身を自分のタスクに合わせて書き換えるのが近道です。</p>
        </div>
        <div className="card-grid">
          {workflowTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="template-card"
              onClick={() => createWorkflow(template.id)}
            >
              <strong>{template.name}</strong>
              <span className="template-tagline">{template.tagline}</span>
              <span className="template-description">{template.description}</span>
            </button>
          ))}
          <button type="button" className="template-card is-blank" onClick={() => createWorkflow()}>
            <Plus size={20} aria-hidden="true" />
            <strong>空のワークフロー</strong>
            <span className="template-description">ゼロから自分で組み立てる</span>
          </button>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-title">
          <h2>あなたのワークフロー</h2>
          <div className="home-section-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp size={15} aria-hidden="true" />
              workflow.json をインポート
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
                event.target.value = "";
              }}
            />
          </div>
        </div>
        {importError && <p className="import-error">{importError}</p>}
        {workflows.length === 0 ? (
          <p className="empty-state">
            まだワークフローがありません。テンプレートから作成してみましょう。
          </p>
        ) : (
          <div className="card-grid">
            {workflows.map((workflow) => {
              const stepCount = workflow.blocks.reduce(
                (total, block) => total + (block.type === "step" ? 1 : block.steps.length),
                0,
              );
              const loopCount = workflow.blocks.filter((block) => block.type === "loop").length;
              return (
                <div key={workflow.id} className="workflow-card">
                  <button
                    type="button"
                    className="workflow-card-open"
                    onClick={() => selectWorkflow(workflow.id)}
                  >
                    <strong>{workflow.name}</strong>
                    <span className="template-description">
                      {workflow.description || "説明なし"}
                    </span>
                    <span className="workflow-card-meta">
                      {stepCount} ステップ{loopCount > 0 ? ` ・ ループ ${loopCount}` : ""}
                    </span>
                  </button>
                  <div className="workflow-card-actions">
                    <button type="button" title="開く" onClick={() => selectWorkflow(workflow.id)}>
                      <FolderOpen size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="複製"
                      onClick={() => duplicateWorkflow(workflow.id)}
                    >
                      <Copy size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      title="削除"
                      className="danger"
                      onClick={() => {
                        if (window.confirm(`「${workflow.name}」を削除しますか?`)) {
                          deleteWorkflow(workflow.id);
                        }
                      }}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
