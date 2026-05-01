import { useMemo } from "react";
import {
  addEdge,
  applyEdgeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnNodeDrag,
} from "@xyflow/react";
import type { Harness, HarnessEdge, HarnessNode, WorkflowLoop } from "../types/harness";
import { createEmptyHandoffContract } from "../utils/stepContract";
import { TaskNode } from "./nodes/TaskNode";
import { ContextNode } from "./nodes/ContextNode";
import { AgentNode } from "./nodes/AgentNode";
import { GateNode } from "./nodes/GateNode";
import { ReviewNode } from "./nodes/ReviewNode";

const nodeTypes: NodeTypes = {
  task: TaskNode,
  context: ContextNode,
  agent: AgentNode,
  review: ReviewNode,
  gate: GateNode,
};

type HarnessCanvasProps = {
  harness: Harness;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLoop: WorkflowLoop | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onMoveNode: (nodeId: string, position: HarnessNode["position"]) => void;
  onEdgesChange: (edges: HarnessEdge[]) => void;
};

export function HarnessCanvas({
  harness,
  selectedNodeId,
  selectedEdgeId,
  selectedLoop,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onEdgesChange,
}: HarnessCanvasProps) {
  const nodes = useMemo<Node[]>(
    () =>
      harness.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node,
          loopMembership: {
            loopNames: harness.loops
              .filter((loop) => loop.nodeIds.includes(node.id))
              .map((loop) => loop.name),
            isInSelectedLoop: Boolean(selectedLoop?.nodeIds.includes(node.id)),
            isLoopEntry: selectedLoop?.entryNodeId === node.id,
            isLoopExitTarget: selectedLoop?.exitTargetNodeId === node.id,
            selectedLoopName: selectedLoop?.name ?? "",
          },
        },
        selected: node.id === selectedNodeId,
      })),
    [harness.nodes, harness.loops, selectedNodeId, selectedLoop],
  );

  const edges = useMemo<Edge[]>(
    () =>
      harness.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        selected: edge.id === selectedEdgeId,
      })),
    [harness.edges, selectedEdgeId],
  );

  const toHarnessEdges = (reactFlowEdges: Edge[]): HarnessEdge[] =>
    reactFlowEdges.map((edge) => {
      const existingEdge = harness.edges.find((harnessEdge) => harnessEdge.id === edge.id);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        handoff: existingEdge?.handoff ?? createEmptyHandoffContract(),
      };
    });

  const handleConnect: OnConnect = (connection: Connection) => {
    onEdgesChange(toHarnessEdges(addEdge(connection, edges)));
  };

  const handleNodeDragStop: OnNodeDrag = (_, node) => {
    onMoveNode(node.id, node.position);
  };

  const handleEdgesChange: OnEdgesChange = (changes: EdgeChange[]) => {
    const selectionChanges = changes.filter((change) => change.type === "select");

    if (selectionChanges.length > 0) {
      const selectedChange = selectionChanges.find((change) => change.selected);
      onSelectEdge(selectedChange?.id ?? null);
    }

    if (changes.some((change) => change.type !== "select")) {
      const nextEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(toHarnessEdges(nextEdges));
    }
  };

  const handleNodesChange: OnNodesChange = (changes: NodeChange[]) => {
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        onMoveNode(change.id, change.position);
      }

      if (change.type === "select" && change.selected) {
        onSelectNode(change.id);
      }
    });
  };

  return (
    <div className="canvas-shell">
      <ReactFlow
        key={harness.id}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16, maxZoom: 1 }}
        onConnect={handleConnect}
        onEdgesChange={handleEdgesChange}
        onNodesChange={handleNodesChange}
        onEdgeClick={(_, edge) => {
          onSelectEdge(edge.id);
        }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => {
          onSelectNode(null);
          onSelectEdge(null);
        }}
        onNodeDragStop={handleNodeDragStop}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
