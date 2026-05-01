import { Plus, RotateCcw } from "lucide-react";
import type { Harness } from "../types/harness";

type HarnessListProps = {
  harnesses: Harness[];
  onCreate: () => void;
  onOpen: (harnessId: string) => void;
  onReset: () => void;
};

export function HarnessList({ harnesses, onCreate, onOpen, onReset }: HarnessListProps) {
  return (
    <main className="list-screen">
      <header className="list-header">
        <div>
          <h1>Harness Studio</h1>
          <p>AIコーディングエージェント向けの作業フローを設計するローカルGUIです。</p>
        </div>
        <div className="list-actions">
          <button className="ghost-button" type="button" onClick={onReset}>
            <RotateCcw size={18} aria-hidden="true" />
            サンプルに戻す
          </button>
          <button className="primary-button" type="button" onClick={onCreate}>
            <Plus size={18} aria-hidden="true" />
            新規Harness
          </button>
        </div>
      </header>

      <section className="harness-grid" aria-label="Harness一覧">
        {harnesses.map((harness) => (
          <button
            className="harness-card"
            type="button"
            key={harness.id}
            onClick={() => onOpen(harness.id)}
          >
            <span>{harness.name}</span>
            <p>{harness.description}</p>
            <small>
              {harness.nodes.length} nodes / {harness.edges.length} connections
            </small>
          </button>
        ))}
      </section>
    </main>
  );
}
