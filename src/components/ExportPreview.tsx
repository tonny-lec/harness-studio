import { useMemo, useState } from "react";
import { Clipboard, Download } from "lucide-react";
import type { Harness, HarnessNode } from "../types/harness";
import {
  exportFormatLabels,
  exportHarnessByFormat,
  type ExportFormat,
} from "../utils/exportMarkdown";
import type { ExportBundle } from "../export/bundleTypes";
import { buildClaudeCodePack } from "../export/exportClaudeCodePack";
import { buildAgentRunnerPack } from "../export/exportAgentRunnerPack";
import { downloadBundleZip } from "../export/zipBundle";

type BundleTarget = "claude-code-pack" | "agent-runner";
type ExportTarget = ExportFormat | BundleTarget;

const bundleTargetLabels: Record<BundleTarget, string> = {
  "claude-code-pack": "Claude Code Pack（実行可能パッケージ）",
  "agent-runner": "Agent Runner（実行可能パッケージ）",
};

const isBundleTarget = (target: ExportTarget): target is BundleTarget =>
  target === "claude-code-pack" || target === "agent-runner";

type ExportPreviewProps = {
  harness: Harness;
  selectedNode: HarnessNode | null;
};

export function ExportPreview({ harness, selectedNode }: ExportPreviewProps) {
  const [target, setTarget] = useState<ExportTarget>("agents");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "done" | "failed">("idle");

  const bundle: ExportBundle | null = useMemo(() => {
    if (target === "claude-code-pack") {
      return buildClaudeCodePack(harness);
    }
    if (target === "agent-runner") {
      return buildAgentRunnerPack(harness);
    }
    return null;
  }, [harness, target]);

  const markdown = useMemo(
    () => (isBundleTarget(target) ? "" : exportHarnessByFormat(harness, target, selectedNode)),
    [harness, target, selectedNode],
  );

  const selectedFile =
    bundle?.files.find((file) => file.path === selectedFilePath) ?? bundle?.files[0] ?? null;
  const previewContent = bundle ? (selectedFile?.content ?? "") : markdown;

  const handleSelectTarget = (nextTarget: ExportTarget) => {
    setTarget(nextTarget);
    setSelectedFilePath(null);
    setCopyStatus("idle");
    setDownloadStatus("idle");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleDownload = async () => {
    if (!bundle) {
      return;
    }
    try {
      await downloadBundleZip(bundle);
      setDownloadStatus("done");
    } catch {
      setDownloadStatus("failed");
    }
  };

  return (
    <section className="export-panel">
      <div className="panel-title-row">
        <h2>Export Preview（出力プレビュー）</h2>
        <div className="export-actions">
          <label>
            Format（形式）
            <select
              value={target}
              onChange={(event) => handleSelectTarget(event.target.value as ExportTarget)}
            >
              <optgroup label="実行可能パッケージ（ZIPダウンロード）">
                {(Object.keys(bundleTargetLabels) as BundleTarget[]).map((bundleTarget) => (
                  <option value={bundleTarget} key={bundleTarget}>
                    {bundleTargetLabels[bundleTarget]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Markdown（コピー用）">
                {(Object.keys(exportFormatLabels) as ExportFormat[]).map((exportFormat) => (
                  <option value={exportFormat} key={exportFormat}>
                    {exportFormatLabels[exportFormat]}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          {bundle && (
            <button className="ghost-button compact-button" type="button" onClick={handleDownload}>
              <Download size={16} aria-hidden="true" />
              ZIPをダウンロード
            </button>
          )}
          <button className="ghost-button compact-button" type="button" onClick={handleCopy}>
            <Clipboard size={16} aria-hidden="true" />
            コピー
          </button>
          {copyStatus !== "idle" && (
            <span
              className={copyStatus === "copied" ? "copy-status" : "copy-status copy-status-error"}
            >
              {copyStatus === "copied" ? "コピーしました" : "コピーに失敗しました"}
            </span>
          )}
          {downloadStatus !== "idle" && (
            <span
              className={
                downloadStatus === "done" ? "copy-status" : "copy-status copy-status-error"
              }
            >
              {downloadStatus === "done" ? "ダウンロードしました" : "ダウンロードに失敗しました"}
            </span>
          )}
        </div>
      </div>
      {bundle ? (
        <div className="export-bundle-layout">
          <aside className="export-file-list" aria-label="Bundle files（パッケージ内ファイル）">
            <p className="export-bundle-description">{bundle.description}</p>
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
                    onClick={() => {
                      setSelectedFilePath(file.path);
                      setCopyStatus("idle");
                    }}
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
        <pre>{previewContent}</pre>
      )}
    </section>
  );
}
