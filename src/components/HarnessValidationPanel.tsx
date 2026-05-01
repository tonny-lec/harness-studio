import type { HarnessValidationIssue } from "../types/harness";

type HarnessValidationPanelProps = {
  issues: HarnessValidationIssue[];
  onSelectNode: (nodeId: string) => void;
};

const severityLabels: Record<HarnessValidationIssue["severity"], string> = {
  error: "Errors",
  warning: "Warnings",
  info: "Info",
};

const severityOrder: HarnessValidationIssue["severity"][] = ["error", "warning", "info"];

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
          <h2>Harness Validation</h2>
          <p className="helper-text">Checks structural completeness and handoff coherence.</p>
        </div>
        <div className="validation-summary" aria-label="Validation issue counts">
          <span>{issues.length} total</span>
          <span className="severity-error">{counts.error} error</span>
          <span className="severity-warning">{counts.warning} warning</span>
          <span className="severity-info">{counts.info} info</span>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="validation-empty">No validation issues found.</p>
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
                        <span className="validation-scope">{issue.scope}</span>
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
                          Select step
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
