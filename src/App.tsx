import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ContextPackEditor } from "./components/ContextPackEditor";
import { ExportPreview } from "./components/ExportPreview";
import { HarnessCanvas } from "./components/HarnessCanvas";
import { HarnessList } from "./components/HarnessList";
import { HarnessMetadataEditor } from "./components/HarnessMetadataEditor";
import { HarnessOutline } from "./components/HarnessOutline";
import { HarnessValidationPanel } from "./components/HarnessValidationPanel";
import { NodeAddToolbar } from "./components/NodeAddToolbar";
import { NodeEditor } from "./components/NodeEditor";
import { SelectedConnectionEditor } from "./components/SelectedConnectionEditor";
import { SelectedNodePromptBrief } from "./components/SelectedNodePromptBrief";
import { SelectedNodeStepContract } from "./components/SelectedNodeStepContract";
import { WorkflowLoopInspector } from "./components/WorkflowLoopInspector";
import { useHarnessStore } from "./store/harnessStore";
import type { HarnessValidationIssue } from "./types/harness";
import { validateHarness } from "./utils/validateHarness";

type WorkspaceTab = "design" | "validate" | "export";
type HarnessInspectorTarget = "details" | "contextPack";

export default function App() {
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("design");
  const [harnessInspectorTarget, setHarnessInspectorTarget] =
    useState<HarnessInspectorTarget>("details");
  const {
    harnesses,
    selectedHarnessId,
    selectedNodeId,
    selectedEdgeId,
    selectHarness,
    returnToList,
    createHarness,
    selectNode,
    selectEdge,
    updateHarness,
    updatePromptBrief,
    updateStepContract,
    updateHandoffContract,
    addWorkflowLoop,
    updateWorkflowLoop,
    deleteWorkflowLoop,
    updateContextPack,
    addNode,
    deleteNode,
    updateNode,
    updateNodePosition,
    setEdges,
    resetSampleData,
  } = useHarnessStore();

  const selectedHarness = harnesses.find((harness) => harness.id === selectedHarnessId) ?? null;
  const selectedNode = selectedHarness?.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = selectedHarness?.edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const selectedLoop = selectedHarness?.loops.find((loop) => loop.id === selectedLoopId) ?? null;
  const selectedEdgeSource =
    selectedHarness?.nodes.find((node) => node.id === selectedEdge?.source) ?? null;
  const selectedEdgeTarget =
    selectedHarness?.nodes.find((node) => node.id === selectedEdge?.target) ?? null;
  const validationIssues = selectedHarness ? validateHarness(selectedHarness) : [];

  if (!selectedHarness) {
    return (
      <HarnessList
        harnesses={harnesses}
        onCreate={createHarness}
        onOpen={selectHarness}
        onReset={resetSampleData}
      />
    );
  }

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedLoopId(null);
    setHarnessInspectorTarget("details");
    selectNode(nodeId);
  };

  const handleSelectEdge = (edgeId: string | null) => {
    setSelectedLoopId(null);
    setHarnessInspectorTarget("details");
    selectEdge(edgeId);
  };

  const handleSelectLoop = (loopId: string | null) => {
    selectNode(null);
    selectEdge(null);
    setHarnessInspectorTarget("details");
    setSelectedLoopId(loopId);
  };

  const handleSelectHarnessDetails = () => {
    selectNode(null);
    selectEdge(null);
    setSelectedLoopId(null);
    setHarnessInspectorTarget("details");
  };

  const handleSelectContextPack = () => {
    selectNode(null);
    selectEdge(null);
    setSelectedLoopId(null);
    setHarnessInspectorTarget("contextPack");
  };

  const handleAddLoop = () => {
    const loopId = addWorkflowLoop();
    if (loopId) {
      handleSelectLoop(loopId);
    }
  };

  const handleNavigateValidationIssue = (issue: HarnessValidationIssue) => {
    setActiveTab("design");

    if (issue.scope === "node" && issue.targetId) {
      handleSelectNode(issue.targetId);
      return;
    }

    if (issue.scope === "edge" && issue.targetId) {
      handleSelectEdge(issue.targetId);
      return;
    }

    if (issue.scope === "workflowLoop" && issue.targetId) {
      handleSelectLoop(issue.targetId);
      return;
    }

    if (issue.scope === "contextPack") {
      handleSelectContextPack();
      return;
    }

    handleSelectHarnessDetails();
  };

  return (
    <main className="studio-screen">
      <header className="studio-header">
        <button
          className="ghost-button"
          type="button"
          onClick={returnToList}
          aria-label="一覧に戻る"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Harness一覧
        </button>
        <div>
          <h1>{selectedHarness.name}</h1>
          <p>{selectedHarness.description}</p>
        </div>
        <nav className="workspace-tabs" aria-label="Workspace sections">
          {(["design", "validate", "export"] as WorkspaceTab[]).map((tab) => (
            <button
              className={activeTab === tab ? "workspace-tab is-active" : "workspace-tab"}
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "design" ? "Design" : tab === "validate" ? "Validate" : "Export"}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "design" && (
        <div className="workspace-design-layout">
          <aside className="workspace-left-panel">
            <HarnessOutline
              harness={selectedHarness}
              issues={validationIssues}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              selectedLoopId={selectedLoopId}
              onSelectHarnessDetails={handleSelectHarnessDetails}
              onSelectContextPack={handleSelectContextPack}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
              onSelectLoop={handleSelectLoop}
              onAddLoop={handleAddLoop}
              onOpenValidate={() => setActiveTab("validate")}
              onOpenExport={() => setActiveTab("export")}
            />
          </aside>

          <section
            className="workspace-canvas-panel"
            aria-label="Harness canvas（ハーネスキャンバス）"
          >
            <NodeAddToolbar
              onAddNode={(nodeType) => {
                setSelectedLoopId(null);
                addNode(nodeType);
              }}
            />
            <HarnessCanvas
              harness={selectedHarness}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              selectedLoop={selectedLoop}
              onSelectNode={handleSelectNode}
              onSelectEdge={handleSelectEdge}
              onMoveNode={updateNodePosition}
              onEdgesChange={setEdges}
            />
          </section>

          {selectedEdge ? (
            <SelectedConnectionEditor
              edge={selectedEdge}
              sourceNode={selectedEdgeSource}
              targetNode={selectedEdgeTarget}
              onChange={updateHandoffContract}
            />
          ) : selectedLoop ? (
            <WorkflowLoopInspector
              loop={selectedLoop}
              nodes={selectedHarness.nodes}
              onChange={updateWorkflowLoop}
              onDelete={deleteWorkflowLoop}
            />
          ) : selectedNode ? (
            <NodeEditor node={selectedNode} onChange={updateNode} onDelete={deleteNode}>
              <SelectedNodePromptBrief node={selectedNode} onChange={updatePromptBrief} />
              <SelectedNodeStepContract node={selectedNode} onChange={updateStepContract} />
            </NodeEditor>
          ) : (
            <aside className="side-panel">
              {harnessInspectorTarget === "contextPack" ? (
                <>
                  <h2>Context Pack（共有前提情報）</h2>
                  <p className="empty-state">
                    Harness全体で共有するプロジェクト・ドメイン知識を編集します。
                  </p>
                  <ContextPackEditor
                    harnessId={selectedHarness.id}
                    contextPack={selectedHarness.contextPack}
                    onChange={updateContextPack}
                  />
                </>
              ) : (
                <>
                  <h2>Harness Details（ハーネス詳細）</h2>
                  <p className="empty-state">
                    Workflow Step、Connection、Workflow
                    Loopを選択すると、この領域で詳細を編集できます。
                  </p>
                  <HarnessMetadataEditor harness={selectedHarness} onChange={updateHarness} />
                  <ContextPackEditor
                    harnessId={selectedHarness.id}
                    contextPack={selectedHarness.contextPack}
                    onChange={updateContextPack}
                  />
                </>
              )}
            </aside>
          )}
        </div>
      )}

      {activeTab === "validate" && (
        <section className="workspace-focus-panel">
          <HarnessValidationPanel
            issues={validationIssues}
            onNavigateIssue={handleNavigateValidationIssue}
          />
        </section>
      )}

      {activeTab === "export" && (
        <section className="workspace-focus-panel">
          <ExportPreview harness={selectedHarness} selectedNode={selectedNode} />
        </section>
      )}
    </main>
  );
}
