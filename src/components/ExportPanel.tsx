import { useMemo, useState } from "react";
import { AlertTriangle, Clipboard, Download } from "lucide-react";
import type { Workflow } from "../types/workflow";
import { validateWorkflow } from "../utils/validateWorkflow";
import type { ExportBundle } from "../export/bundleTypes";
import { buildCodexRunnerPack } from "../export/exportCodexRunnerPack";
import { buildClaudeCodePack } from "../export/exportClaudeCodePack";
import { buildWorkflowJson } from "../export/workflowJson";
import { downloadBundleZip } from "../export/zipBundle";
import { fileSlug } from "../export/plan";

type ExportTarget = "codex-runner" | "claude-code-pack" | "workflow-json";

const targetLabels: Record<ExportTarget, { label: string; hint: string }> = {
  "codex-runner": {
    label: "Codex Runner(ZIP)",
    hint: "OpenAI Codex SDK で全ステップを自動実行するランナー。npm install && node run.mjs で動きます。",
  },
  "claude-code-pack": {
    label: "Claude Code Pack(ZIP)",
    hint: "リポジトリに展開して /harness-run で実行できるスラッシュコマンド集。",
  },
  "workflow-json": {
    label: "workflow.json(設計データ)",
    hint: "ワークフロー設計の機械可読データ。Harness Studio に再インポートできます。",
  },
};

type ExportPanelProps = {
  workflow: Workflow;
};

export function ExportPanel({ workflow }: ExportPanelProps) {
  const [target, setTarget] = useState<ExportTarget>("codex-runner");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const issues = useMemo(() => validateWorkflow(workflow), [workflow]);
  const errors = issues.filter((issue) => issue.severity === "error");

  const bundle: ExportBundle | null = useMemo(() => {
    if (target === "codex-runner") {
      return buildCodexRunnerPack(workflow);
    }
    if (target === "claude-code-pack") {
      return buildClaudeCodePack(workflow);
    }
    return null;
  }, [target, workflow]);

  const jsonContent = useMemo(
    () => `${JSON.stringify(buildWorkflowJson(workflow), null, 2)}\n`,
    [workflow],
  );

  const selectedFile =
    bundle?.files.find((file) => file.path === selectedFilePath) ?? bundle?.files[0] ?? null;
  const previewContent = bundle ? (selectedFile?.content ?? "") : jsonContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setStatus("コピーしました");
    } catch {
      setStatus("コピーに失敗しました");
    }
  };

  const handleDownload = async () => {
    try {
      if (bundle) {
        await downloadBundleZip(bundle);
      } else {
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${fileSlug(workflow.name, "workflow")}-workflow.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }
      setStatus("ダウンロードしました");
    } catch {
      setStatus("ダウンロードに失敗しました");
    }
  };

  return (
    <section className="export-panel">
      {issues.length > 0 && (
        <div className={errors.length > 0 ? "issue-banner is-error" : "issue-banner"}>
          <AlertTriangle size={16} aria-hidden="true" />
          <div>
            {errors.length > 0 ? (
              <strong>
                未解決のエラーがあります。書き出しはできますが、実行に失敗する可能性があります。
              </strong>
            ) : (
              <strong>改善できる点があります(書き出しは可能です)。</strong>
            )}
            <ul>
              {issues.slice(0, 5).map((issue) => (
                <li key={issue.id}>{issue.message}</li>
              ))}
              {issues.length > 5 && <li>ほか {issues.length - 5} 件</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="export-target-row">
        {(Object.keys(targetLabels) as ExportTarget[]).map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={`export-target${target === candidate ? " is-active" : ""}`}
            onClick={() => {
              setTarget(candidate);
              setSelectedFilePath(null);
              setStatus("");
            }}
          >
            <strong>{targetLabels[candidate].label}</strong>
            <span>{targetLabels[candidate].hint}</span>
          </button>
        ))}
      </div>

      <div className="export-actions-row">
        <button type="button" className="primary-button" onClick={handleDownload}>
          <Download size={16} aria-hidden="true" />
          {bundle ? "ZIPをダウンロード" : "JSONをダウンロード"}
        </button>
        <button type="button" className="ghost-button" onClick={handleCopy}>
          <Clipboard size={16} aria-hidden="true" />
          表示中の内容をコピー
        </button>
        {status && <span className="status-text">{status}</span>}
      </div>

      {bundle ? (
        <div className="export-bundle-layout">
          <aside className="export-file-list" aria-label="パッケージ内ファイル">
            <ul>
              {bundle.files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    className={
                      file.path === (selectedFile?.path ?? "")
                        ? "export-file-item is-active"
                        : "export-file-item"
                    }
                    onClick={() => setSelectedFilePath(file.path)}
                  >
                    {file.path}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <pre>{previewContent}</pre>
        </div>
      ) : (
        <pre className="export-json-preview">{previewContent}</pre>
      )}
    </section>
  );
}
