import { useMemo, useState } from "react";
import { Clipboard } from "lucide-react";
import type { Harness, HarnessNode } from "../types/harness";
import {
  exportFormatLabels,
  exportHarnessByFormat,
  type ExportFormat,
} from "../utils/exportMarkdown";

type ExportPreviewProps = {
  harness: Harness;
  selectedNode: HarnessNode | null;
};

export function ExportPreview({ harness, selectedNode }: ExportPreviewProps) {
  const [format, setFormat] = useState<ExportFormat>("agents");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const markdown = useMemo(
    () => exportHarnessByFormat(harness, format, selectedNode),
    [format, harness, selectedNode],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <section className="export-panel">
      <div className="panel-title-row">
        <h2>Export Preview</h2>
        <div className="export-actions">
          <label>
            Format
            <select
              value={format}
              onChange={(event) => {
                setFormat(event.target.value as ExportFormat);
                setCopyStatus("idle");
              }}
            >
              {(Object.keys(exportFormatLabels) as ExportFormat[]).map((exportFormat) => (
                <option value={exportFormat} key={exportFormat}>
                  {exportFormatLabels[exportFormat]}
                </option>
              ))}
            </select>
          </label>
          <button className="ghost-button compact-button" type="button" onClick={handleCopy}>
            <Clipboard size={16} aria-hidden="true" />
            Copy
          </button>
          {copyStatus !== "idle" && (
            <span className={copyStatus === "copied" ? "copy-status" : "copy-status copy-status-error"}>
              {copyStatus === "copied" ? "Copied" : "Copy failed"}
            </span>
          )}
        </div>
      </div>
      <pre>{markdown}</pre>
    </section>
  );
}
