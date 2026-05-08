import type { HarnessValidationIssue } from "../types/harness";

type HarnessValidationPanelProps = {
  issues: HarnessValidationIssue[];
  onNavigateIssue: (issue: HarnessValidationIssue) => void;
};

const severityLabels: Record<HarnessValidationIssue["severity"], string> = {
  error: "エラー",
  warning: "警告",
  info: "情報",
};

const severityOrder: HarnessValidationIssue["severity"][] = ["error", "warning", "info"];

const scopeLabels: Record<HarnessValidationIssue["scope"], string> = {
  harness: "Harness",
  contextPack: "Context Pack",
  node: "Node",
  edge: "Edge",
  workflowLoop: "Workflow Loop",
};

const isNavigableIssue = (issue: HarnessValidationIssue) =>
  issue.scope === "harness" || issue.scope === "contextPack" || Boolean(issue.targetId);

const navigationLabel = (issue: HarnessValidationIssue) => {
  if (issue.scope === "harness") {
    return "Harness Detailsを開く";
  }

  if (issue.scope === "contextPack") {
    return "Context Packを開く";
  }

  if (issue.scope === "node") {
    return "このStepを選択";
  }

  if (issue.scope === "edge") {
    return "このConnectionを選択";
  }

  return "このWorkflow Loopを選択";
};

export function HarnessValidationPanel({ issues, onNavigateIssue }: HarnessValidationPanelProps) {
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
                  const canNavigate = isNavigableIssue(issue);

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
                      {canNavigate && (
                        <button
                          className="ghost-button compact-button"
                          type="button"
                          onClick={() => onNavigateIssue(issue)}
                        >
                          {navigationLabel(issue)}
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
