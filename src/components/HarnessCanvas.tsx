import { useMemo } from "react";
import {
  addEdge,
  applyEdgeChanges,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
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
import { LoopRegionNode } from "./nodes/LoopRegionNode";
import { ReviewNode } from "./nodes/ReviewNode";

const nodeTypes: NodeTypes = {
  loopRegion: LoopRegionNode,
  task: TaskNode,
  context: ContextNode,
  agent: AgentNode,
  review: ReviewNode,
  gate: GateNode,
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;
const LOOP_SIDE_PADDING = 48;
const LOOP_TOP_PADDING = 112;
const LOOP_BOTTOM_PADDING = 48;

type HarnessCanvasProps = {
  harness: Harness;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLoop: WorkflowLoop | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectEdge: (edgeId: string | null) => void;
  onSelectLoop: (loopId: string | null) => void;
  onMoveNode: (nodeId: string, position: HarnessNode["position"]) => void;
  onEdgesChange: (edges: HarnessEdge[]) => void;
};

const LOOP_REGION_PREFIX = "loop-region-";

const loopIdFromRegionNode = (nodeId: string) =>
  nodeId.startsWith(LOOP_REGION_PREFIX) ? nodeId.slice(LOOP_REGION_PREFIX.length) : null;

export function HarnessCanvas({
  harness,
  selectedNodeId,
  selectedEdgeId,
  selectedLoop,
  onSelectNode,
  onSelectEdge,
  onSelectLoop,
  onMoveNode,
  onEdgesChange,
}: HarnessCanvasProps) {
  const nodes = useMemo<Node[]>(() => {
    const workflowNodes: Node[] = harness.nodes.map((node) => ({
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
      zIndex: 2,
    }));
    const loopRegions = harness.loops.reduce<Node[]>((regions, loop) => {
      const loopNodes = harness.nodes.filter((node) => loop.nodeIds.includes(node.id));

      if (loopNodes.length === 0) {
        return regions;
      }

      const minX = Math.min(...loopNodes.map((node) => node.position.x));
      const minY = Math.min(...loopNodes.map((node) => node.position.y));
      const maxX = Math.max(...loopNodes.map((node) => node.position.x + NODE_WIDTH));
      const maxY = Math.max(...loopNodes.map((node) => node.position.y + NODE_HEIGHT));
      const exitTargetName = loop.exitTargetNodeId
        ? (harness.nodes.find((node) => node.id === loop.exitTargetNodeId)?.name ?? "")
        : "";
      const entryNodeName = harness.nodes.find((node) => node.id === loop.entryNodeId)?.name ?? "";

      regions.push({
        id: `loop-region-${loop.id}`,
        type: "loopRegion",
        position: {
          x: minX - LOOP_SIDE_PADDING,
          y: minY - LOOP_TOP_PADDING,
        },
        data: {
          loopId: loop.id,
          name: loop.name,
          includedCount: loop.nodeIds.length,
          entryNodeName,
          maxIterations: loop.maxIterations,
          exitTargetName,
          exitConditionCount: loop.exitConditions.length,
          isSelected: selectedLoop?.id === loop.id,
        },
        style: {
          width: maxX - minX + LOOP_SIDE_PADDING * 2,
          height: maxY - minY + LOOP_TOP_PADDING + LOOP_BOTTOM_PADDING,
        },
        draggable: false,
        selected: selectedLoop?.id === loop.id,
        selectable: true,
        connectable: false,
        deletable: false,
        zIndex: 0,
      });

      return regions;
    }, []);

    return [...loopRegions, ...workflowNodes];
  }, [harness.nodes, harness.loops, selectedNodeId, selectedLoop]);

  const edges = useMemo<Edge[]>(
    () =>
      harness.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.handoff?.kind === "conditional",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: edge.id === selectedEdgeId ? "#2251d1" : "#66758a",
        },
        style: {
          stroke: edge.id === selectedEdgeId ? "#2251d1" : "#66758a",
          strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
        },
        selected: edge.id === selectedEdgeId,
        interactionWidth: 18,
        zIndex: 1,
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
    if (loopIdFromRegionNode(node.id)) {
      return;
    }

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
      const changeId = "id" in change ? change.id : "";
      const loopId = loopIdFromRegionNode(changeId);

      if (change.type === "position" && change.position) {
        if (loopId) {
          return;
        }

        onMoveNode(change.id, change.position);
      }

      if (change.type === "select" && change.selected) {
        if (loopId) {
          onSelectLoop(loopId);
          return;
        }

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
        onNodeClick={(_, node) => {
          const loopId = loopIdFromRegionNode(node.id);

          if (loopId) {
            onSelectLoop(loopId);
            return;
          }

          onSelectNode(node.id);
        }}
        onPaneClick={() => {
          onSelectNode(null);
          onSelectEdge(null);
          onSelectLoop(null);
        }}
        onNodeDragStop={handleNodeDragStop}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Panel position="top-left" className="canvas-workspace-summary">
          <span>{harness.nodes.length} steps</span>
          <span>{harness.edges.length} connections</span>
          <span>{harness.loops.length} loops</span>
        </Panel>
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
