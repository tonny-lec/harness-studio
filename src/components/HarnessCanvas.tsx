import { useMemo, useRef } from "react";
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
const NODE_COLLISION_GAP = 24;
const COLLISION_SEARCH_STEP = 32;
const COLLISION_SEARCH_RADIUS = 12;
const LOOP_SIDE_PADDING = 48;
const LOOP_TOP_PADDING = 112;
const LOOP_BOTTOM_PADDING = 48;
const LOOP_HEADER_WIDTH = 340;
const LOOP_HEADER_HEIGHT = 72;
const LOOP_HEADER_OFFSET_X = 12;
const LOOP_HEADER_OFFSET_Y = 14;

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

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const toNodeRect = (position: HarnessNode["position"], margin = 0): Rect => ({
  x: position.x - margin,
  y: position.y - margin,
  width: NODE_WIDTH + margin * 2,
  height: NODE_HEIGHT + margin * 2,
});

const doRectsOverlap = (first: Rect, second: Rect) =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

const nodePositionWithCandidate = (
  node: HarnessNode,
  movingNodeId: string,
  candidatePosition: HarnessNode["position"],
) => (node.id === movingNodeId ? candidatePosition : node.position);

const loopHeaderRectsForCandidate = (
  harness: Harness,
  movingNodeId: string,
  candidatePosition: HarnessNode["position"],
): Rect[] =>
  harness.loops.flatMap((loop) => {
    const loopNodes = harness.nodes.filter((node) => loop.nodeIds.includes(node.id));

    if (loopNodes.length === 0) {
      return [];
    }

    const positions = loopNodes.map((node) =>
      nodePositionWithCandidate(node, movingNodeId, candidatePosition),
    );
    const minX = Math.min(...positions.map((position) => position.x));
    const minY = Math.min(...positions.map((position) => position.y));
    const maxX = Math.max(...positions.map((position) => position.x + NODE_WIDTH));
    const regionWidth = maxX - minX + LOOP_SIDE_PADDING * 2;

    return [
      {
        x: minX - LOOP_SIDE_PADDING + LOOP_HEADER_OFFSET_X,
        y: minY - LOOP_TOP_PADDING + LOOP_HEADER_OFFSET_Y,
        width: Math.min(LOOP_HEADER_WIDTH, Math.max(0, regionWidth - LOOP_HEADER_OFFSET_X * 2)),
        height: LOOP_HEADER_HEIGHT,
      },
    ];
  });

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
  const dragStartPositions = useRef<Record<string, HarnessNode["position"]>>({});

  const isSafeNodePosition = (nodeId: string, candidatePosition: HarnessNode["position"]) => {
    const candidateRect = toNodeRect(candidatePosition);
    const overlapsNode = harness.nodes.some(
      (node) =>
        node.id !== nodeId &&
        doRectsOverlap(candidateRect, toNodeRect(node.position, NODE_COLLISION_GAP)),
    );

    if (overlapsNode) {
      return false;
    }

    return !loopHeaderRectsForCandidate(harness, nodeId, candidatePosition).some((headerRect) =>
      doRectsOverlap(candidateRect, headerRect),
    );
  };

  const findSafeNodePosition = (
    nodeId: string,
    attemptedPosition: HarnessNode["position"],
  ): HarnessNode["position"] => {
    if (isSafeNodePosition(nodeId, attemptedPosition)) {
      return attemptedPosition;
    }

    const candidates: HarnessNode["position"][] = [];

    for (let radius = 1; radius <= COLLISION_SEARCH_RADIUS; radius += 1) {
      for (let xStep = -radius; xStep <= radius; xStep += 1) {
        for (let yStep = -radius; yStep <= radius; yStep += 1) {
          if (Math.max(Math.abs(xStep), Math.abs(yStep)) !== radius) {
            continue;
          }

          candidates.push({
            x: attemptedPosition.x + xStep * COLLISION_SEARCH_STEP,
            y: attemptedPosition.y + yStep * COLLISION_SEARCH_STEP,
          });
        }
      }
    }

    const safeCandidate = candidates
      .sort((first, second) => {
        const firstDistance =
          Math.abs(first.x - attemptedPosition.x) + Math.abs(first.y - attemptedPosition.y);
        const secondDistance =
          Math.abs(second.x - attemptedPosition.x) + Math.abs(second.y - attemptedPosition.y);

        return firstDistance - secondDistance;
      })
      .find((candidate) => isSafeNodePosition(nodeId, candidate));

    if (safeCandidate) {
      return safeCandidate;
    }

    const fallbackPosition = dragStartPositions.current[nodeId];

    return fallbackPosition && isSafeNodePosition(nodeId, fallbackPosition)
      ? fallbackPosition
      : attemptedPosition;
  };

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

    onMoveNode(node.id, findSafeNodePosition(node.id, node.position));
    delete dragStartPositions.current[node.id];
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

        onMoveNode(change.id, findSafeNodePosition(change.id, change.position));
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
        onNodeDragStart={(_, node) => {
          if (loopIdFromRegionNode(node.id)) {
            return;
          }

          const harnessNode = harness.nodes.find((currentNode) => currentNode.id === node.id);

          if (harnessNode) {
            dragStartPositions.current[node.id] = harnessNode.position;
          }
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
