import { ArrowLeft } from "lucide-react";
import { ContextPackEditor } from "./components/ContextPackEditor";
import { ExportPreview } from "./components/ExportPreview";
import { HarnessCanvas } from "./components/HarnessCanvas";
import { HarnessList } from "./components/HarnessList";
import { HarnessMetadataEditor } from "./components/HarnessMetadataEditor";
import { NodeAddToolbar } from "./components/NodeAddToolbar";
import { NodeEditor } from "./components/NodeEditor";
import { SelectedNodePromptBrief } from "./components/SelectedNodePromptBrief";
import { SelectedNodeStepContract } from "./components/SelectedNodeStepContract";
import { useHarnessStore } from "./store/harnessStore";

export default function App() {
  const {
    harnesses,
    selectedHarnessId,
    selectedNodeId,
    selectHarness,
    returnToList,
    createHarness,
    selectNode,
    updateHarness,
    updatePromptBrief,
    updateStepContract,
    updateContextPack,
    addNode,
    deleteNode,
    updateNode,
    updateNodePosition,
    setEdges,
    resetSampleData,
  } = useHarnessStore();

  const selectedHarness = harnesses.find((harness) => harness.id === selectedHarnessId) ?? null;
  const selectedNode =
    selectedHarness?.nodes.find((node) => node.id === selectedNodeId) ?? null;

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

  return (
    <main className="studio-screen">
      <header className="studio-header">
        <button className="ghost-button" type="button" onClick={returnToList} aria-label="Back to list">
          <ArrowLeft size={18} aria-hidden="true" />
          Harnesses
        </button>
        <div>
          <h1>{selectedHarness.name}</h1>
          <p>{selectedHarness.description}</p>
        </div>
      </header>

      <div className="studio-layout">
        <section className="canvas-column" aria-label="Harness canvas">
          <HarnessMetadataEditor harness={selectedHarness} onChange={updateHarness} />
          <ContextPackEditor
            harnessId={selectedHarness.id}
            contextPack={selectedHarness.contextPack}
            onChange={updateContextPack}
          />
          <SelectedNodePromptBrief node={selectedNode} onChange={updatePromptBrief} />
          <SelectedNodeStepContract node={selectedNode} onChange={updateStepContract} />
          <NodeAddToolbar onAddNode={addNode} />
          <HarnessCanvas
            harness={selectedHarness}
            selectedNodeId={selectedNodeId}
            onSelectNode={selectNode}
            onMoveNode={updateNodePosition}
            onEdgesChange={setEdges}
          />
          <ExportPreview harness={selectedHarness} selectedNode={selectedNode} />
        </section>
        <NodeEditor
          node={selectedNode}
          onChange={updateNode}
          onDelete={deleteNode}
        />
      </div>
    </main>
  );
}
