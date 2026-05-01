import type { HarnessValidationIssue } from "../types/harness";

type HarnessValidationPanelProps = {
  issues: HarnessValidationIssue[];
  onSelectNode: (nodeId: string) => void;
};

const severityLabels: Record<HarnessValidationIssue["severity"], string> = {
  error: "エラー",
  warning: "警告",
  info: "情報",
};

const severityOrder: HarnessValidationIssue["severity"][] = ["error", "warning", "info"];

const scopeLabels: Record<HarnessValidationIssue["scope"], string> = {
  harness: "Harness",
  node: "Node",
  edge: "Edge",
  loop: "Loop",
};

export function HarnessValidationPanel({ issues, onSelectNode }: HarnessValidationPanelProps) {
  const counts = severityOrder.reduce(
    (accumulator, severity) => ({
      ...accumulator,
      [severity]: issues.filter((issue) => issue.severity === severity).length,
    }),
    { error: 0, warning: 0, info: 0 },
  );

  return (
    <section className="validation-panel">
      <div className="panel-title-row">
        <div>
          <h2>ハーネス検証</h2>
          <p className="helper-text">現在のハーネス設計に不足や不整合がないかを確認します。</p>
        </div>
        <div className="validation-summary" aria-label="検証issue数">
          <span>合計 {issues.length}</span>
          <span className="severity-error">エラー {counts.error}</span>
          <span className="severity-warning">警告 {counts.warning}</span>
          <span className="severity-info">情報 {counts.info}</span>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="validation-empty">検証issueはありません。</p>
      ) : (
        <div className="validation-list">
          {severityOrder.map((severity) => {
            const severityIssues = issues.filter((issue) => issue.severity === severity);

            if (severityIssues.length === 0) {
              return null;
            }

            return (
              <section className="validation-group" key={severity}>
                <h3>{severityLabels[severity]}</h3>
                {severityIssues.map((issue) => {
                  const canSelectTarget = issue.scope === "node" && issue.targetId;

                  return (
                    <article
                      className={`validation-issue validation-issue-${issue.severity}`}
                      key={issue.id}
                    >
                      <div>
                        <span className="validation-scope">{scopeLabels[issue.scope]}</span>
                        <h4>{issue.title}</h4>
                      </div>
                      <p>{issue.message}</p>
                      {issue.recommendation && (
                        <p className="validation-recommendation">{issue.recommendation}</p>
                      )}
                      {canSelectTarget && (
                        <button
                          className="ghost-button compact-button"
                          type="button"
                          onClick={() => onSelectNode(issue.targetId as string)}
                        >
                          このStepを選択
                        </button>
                      )}
                    </article>
                  );
                })}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
