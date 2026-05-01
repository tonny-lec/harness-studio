import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ContextPackInspector } from "./components/ContextPackInspector";
import { ExportPreview } from "./components/ExportPreview";
import { HarnessCanvas } from "./components/HarnessCanvas";
import { HarnessList } from "./components/HarnessList";
import { HarnessOutline } from "./components/HarnessOutline";
import { HarnessOverviewInspector } from "./components/HarnessOverviewInspector";
import { HarnessValidationPanel } from "./components/HarnessValidationPanel";
import { NodeAddToolbar } from "./components/NodeAddToolbar";
import { NodeEditor } from "./components/NodeEditor";
import { SelectedConnectionEditor } from "./components/SelectedConnectionEditor";
import { SelectedNodePromptBrief } from "./components/SelectedNodePromptBrief";
import { SelectedNodeStepContract } from "./components/SelectedNodeStepContract";
import { WorkflowLoopInspector } from "./components/WorkflowLoopInspector";
import { useHarnessStore } from "./store/harnessStore";
import { validateHarness } from "./utils/validateHarness";

type WorkspaceTab = "design" | "validate" | "export";
type OverviewSelection = "harness" | "context" | null;

export default function App() {
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("design");
  const [selectedOverview, setSelectedOverview] = useState<OverviewSelection>("harness");
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

  useEffect(() => {
    setSelectedOverview("harness");
    setSelectedLoopId(null);
  }, [selectedHarnessId]);

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
    setSelectedOverview(null);
    setSelectedLoopId(null);
    selectNode(nodeId);
  };

  const handleSelectEdge = (edgeId: string | null) => {
    setSelectedOverview(null);
    setSelectedLoopId(null);
    selectEdge(edgeId);
  };

  const handleSelectLoop = (loopId: string | null) => {
    setSelectedOverview(null);
    selectNode(null);
    selectEdge(null);
    setSelectedLoopId(loopId);
  };

  const handleSelectOverview = (selection: Exclude<OverviewSelection, null>) => {
    selectNode(null);
    selectEdge(null);
    setSelectedLoopId(null);
    setSelectedOverview(selection);
  };

  const handleAddLoop = () => {
    const loopId = addWorkflowLoop();
    if (loopId) {
      handleSelectLoop(loopId);
    }
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
              selectedOverview={selectedOverview}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              selectedLoopId={selectedLoopId}
              onSelectHarnessOverview={() => handleSelectOverview("harness")}
              onSelectContextPack={() => handleSelectOverview("context")}
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

          {selectedOverview === "harness" ? (
            <HarnessOverviewInspector
              harness={selectedHarness}
              issues={validationIssues}
              onChange={updateHarness}
            />
          ) : selectedOverview === "context" ? (
            <ContextPackInspector
              harnessId={selectedHarness.id}
              contextPack={selectedHarness.contextPack}
              onChange={updateContextPack}
            />
          ) : selectedEdge ? (
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
          ) : (
            <NodeEditor node={selectedNode} onChange={updateNode} onDelete={deleteNode}>
              {selectedNode && (
                <>
                  <SelectedNodePromptBrief node={selectedNode} onChange={updatePromptBrief} />
                  <SelectedNodeStepContract node={selectedNode} onChange={updateStepContract} />
                </>
              )}
            </NodeEditor>
          )}
        </div>
      )}

      {activeTab === "validate" && (
        <section className="workspace-focus-panel">
          <HarnessValidationPanel
            issues={validationIssues}
            onSelectNode={(nodeId) => {
              handleSelectNode(nodeId);
              setActiveTab("design");
            }}
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
