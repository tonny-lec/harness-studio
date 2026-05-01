import { useEffect, useMemo, useState } from "react";
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
import type { Harness, HarnessEdge, HarnessNode } from "../types/harness";
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
  onSelectNode: (nodeId: string | null) => void;
  onMoveNode: (nodeId: string, position: HarnessNode["position"]) => void;
  onEdgesChange: (edges: HarnessEdge[]) => void;
};

export function HarnessCanvas({
  harness,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onEdgesChange,
}: HarnessCanvasProps) {
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  const nodes = useMemo<Node[]>(
    () =>
      harness.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node,
        selected: node.id === selectedNodeId,
      })),
    [harness.nodes, selectedNodeId],
  );

  const edges = useMemo<Edge[]>(
    () =>
      harness.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
        selected: selectedEdgeIds.has(edge.id),
      })),
    [harness.edges, selectedEdgeIds],
  );

  useEffect(() => {
    setSelectedEdgeIds((currentIds) => {
      const nextIds = new Set(
        [...currentIds].filter((edgeId) => harness.edges.some((edge) => edge.id === edgeId)),
      );

      return nextIds.size === currentIds.size ? currentIds : nextIds;
    });
  }, [harness.edges]);

  const toHarnessEdges = (reactFlowEdges: Edge[]): HarnessEdge[] =>
    reactFlowEdges.map((edge) => {
      const existingEdge = harness.edges.find((harnessEdge) => harnessEdge.id === edge.id);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        handoff: existingEdge?.handoff,
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
      setSelectedEdgeIds((currentIds) => {
        const nextIds = new Set(currentIds);

        selectionChanges.forEach((change) => {
          if (change.selected) {
            nextIds.add(change.id);
          } else {
            nextIds.delete(change.id);
          }
        });

        return nextIds;
      });
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
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onConnect={handleConnect}
        onEdgesChange={handleEdgesChange}
        onNodesChange={handleNodesChange}
        onEdgeClick={(_, edge) => {
          onSelectNode(null);
          setSelectedEdgeIds(new Set([edge.id]));
        }}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onPaneClick={() => {
          onSelectNode(null);
          setSelectedEdgeIds(new Set());
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
