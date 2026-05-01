import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ContextPack,
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessNodeType,
  HandoffContract,
  PromptBrief,
  StepContract,
  WorkflowLoop,
} from "../types/harness";
import { sampleHarnesses } from "../data/sampleHarnesses";
import { createEmptyContextPack, normalizeContextPack } from "../utils/contextPack";
import { createEmptyPromptBrief, normalizePromptBrief } from "../utils/promptBrief";
import {
  createEmptyHandoffContract,
  createEmptyStepContract,
  normalizeHandoffContract,
  normalizeEdgeHandoff,
  normalizeStepContract,
} from "../utils/stepContract";
import {
  createEmptyWorkflowLoop,
  migrateLegacyLoopEdge,
  normalizeWorkflowLoop,
} from "../utils/workflowLoop";

const STORAGE_KEY = "harness-studio-state";

type HarnessStore = {
  harnesses: Harness[];
  selectedHarnessId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectHarness: (harnessId: string) => void;
  returnToList: () => void;
  createHarness: () => string;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  updateHarness: (updates: Pick<Partial<Harness>, "name" | "description">) => void;
  updatePromptBrief: (nodeId: string, updates: Partial<PromptBrief>) => void;
  updateStepContract: (nodeId: string, updates: Partial<StepContract>) => void;
  updateHandoffContract: (edgeId: string, updates: Partial<HandoffContract>) => void;
  addWorkflowLoop: () => string | null;
  updateWorkflowLoop: (loopId: string, updates: Partial<WorkflowLoop>) => void;
  deleteWorkflowLoop: (loopId: string) => void;
  updateContextPack: (updates: Partial<ContextPack>) => void;
  addNode: (nodeType: HarnessNodeType) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Omit<HarnessNode, "id" | "type">>) => void;
  updateNodePosition: (nodeId: string, position: HarnessNode["position"]) => void;
  setEdges: (edges: HarnessEdge[]) => void;
  resetSampleData: () => void;
};

type PersistedHarnessState = Pick<HarnessStore, "harnesses" | "selectedHarnessId">;

const legacySampleNodePositions: Record<string, Record<string, HarnessNode["position"]>> = {
  "starter-coding-agent": {
    "task-1": { x: 80, y: 120 },
    "context-1": { x: 370, y: 60 },
    "agent-1": { x: 660, y: 130 },
    "validation-1": { x: 920, y: 170 },
    "review-1": { x: 1180, y: 80 },
  },
  "review-focused-agent": {
    "task-2": { x: 120, y: 120 },
    "context-2": { x: 430, y: 70 },
    "agent-2": { x: 720, y: 140 },
    "review-2": { x: 1010, y: 90 },
  },
};

const sampleNodePositions = new Map(
  sampleHarnesses.flatMap((harness) =>
    harness.nodes.map((node) => [`${harness.id}:${node.id}`, node.position] as const),
  ),
);

const positionsMatch = (
  currentPosition: HarnessNode["position"],
  expectedPosition: HarnessNode["position"] | undefined,
) =>
  Boolean(
    expectedPosition &&
    currentPosition.x === expectedPosition.x &&
    currentPosition.y === expectedPosition.y,
  );

const getNormalizedNodePosition = (
  harnessId: string,
  node: HarnessNode,
): HarnessNode["position"] => {
  const legacyPosition = legacySampleNodePositions[harnessId]?.[node.id];

  if (!positionsMatch(node.position, legacyPosition)) {
    return { ...node.position };
  }

  return { ...(sampleNodePositions.get(`${harnessId}:${node.id}`) ?? node.position) };
};

const cloneHarnesses = (harnesses: Harness[]) =>
  harnesses.map((harness) => {
    const { promptBrief: legacyPromptBrief, ...baseHarness } = harness as Harness & {
      promptBrief?: unknown;
    };
    const legacyBrief = normalizePromptBrief(legacyPromptBrief);
    const migratedLoops = harness.edges
      .map(migrateLegacyLoopEdge)
      .filter((loop): loop is WorkflowLoop => Boolean(loop));
    const existingLoops = Array.isArray((harness as unknown as { loops?: unknown }).loops)
      ? ((harness as unknown as { loops: unknown[] }).loops
          .map(normalizeWorkflowLoop)
          .filter((loop): loop is WorkflowLoop => Boolean(loop)) as WorkflowLoop[])
      : [];
    let didApplyLegacyBrief = false;

    return {
      ...baseHarness,
      contextPack: normalizeContextPack(harness.contextPack),
      nodes: harness.nodes.map((node) => {
        const nodeBrief = normalizePromptBrief(
          (node as unknown as { promptBrief?: unknown }).promptBrief,
        );
        const shouldApplyLegacyBrief =
          !didApplyLegacyBrief &&
          node.type === "task" &&
          !hasPromptBriefContent(nodeBrief) &&
          hasPromptBriefContent(legacyBrief);

        if (shouldApplyLegacyBrief) {
          didApplyLegacyBrief = true;
        }

        return {
          ...node,
          notes: node.notes ?? "",
          promptBrief: shouldApplyLegacyBrief ? legacyBrief : nodeBrief,
          stepContract: normalizeStepContract(
            (node as unknown as { stepContract?: unknown }).stepContract,
            node,
          ),
          inputs: [...node.inputs],
          outputs: [...node.outputs],
          constraints: [...node.constraints],
          position: getNormalizedNodePosition(harness.id, node),
        };
      }),
      edges: harness.edges.map(normalizeEdgeHandoff),
      loops: [...existingLoops, ...migratedLoops],
    };
  });

const hasPromptBriefContent = (promptBrief: PromptBrief) =>
  Boolean(promptBrief.goal) ||
  promptBrief.successCriteria.length > 0 ||
  promptBrief.availableContext.length > 0 ||
  promptBrief.constraints.length > 0 ||
  promptBrief.validation.length > 0 ||
  promptBrief.output.length > 0 ||
  promptBrief.stopRules.length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isHarnessNode = (value: unknown): value is HarnessNode => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const node = value as Record<string, unknown>;
  const position = node.position as Record<string, unknown> | undefined;

  return (
    typeof node.id === "string" &&
    ["task", "context", "agent", "review", "gate"].includes(String(node.type)) &&
    typeof node.name === "string" &&
    typeof node.purpose === "string" &&
    (!("notes" in node) || typeof node.notes === "string") &&
    (!("promptBrief" in node) || typeof node.promptBrief === "object") &&
    (!("stepContract" in node) || typeof node.stepContract === "object") &&
    isStringArray(node.inputs) &&
    isStringArray(node.outputs) &&
    isStringArray(node.constraints) &&
    !!position &&
    typeof position.x === "number" &&
    typeof position.y === "number"
  );
};

const isHarnessEdge = (value: unknown): value is HarnessEdge => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const edge = value as Record<string, unknown>;
  return (
    typeof edge.id === "string" &&
    typeof edge.source === "string" &&
    typeof edge.target === "string"
  );
};

const isHarness = (value: unknown): value is Harness => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const harness = value as Record<string, unknown>;

  return (
    typeof harness.id === "string" &&
    typeof harness.name === "string" &&
    typeof harness.description === "string" &&
    (!("contextPack" in harness) || typeof harness.contextPack === "object") &&
    Array.isArray(harness.nodes) &&
    harness.nodes.every(isHarnessNode) &&
    Array.isArray(harness.edges) &&
    harness.edges.every(isHarnessEdge) &&
    (!("loops" in harness) || Array.isArray(harness.loops))
  );
};

const getSafePersistedState = (persistedState: unknown): PersistedHarnessState => {
  if (!persistedState || typeof persistedState !== "object") {
    return { harnesses: cloneHarnesses(sampleHarnesses), selectedHarnessId: null };
  }

  const state = persistedState as Record<string, unknown>;
  const harnesses =
    Array.isArray(state.harnesses) && state.harnesses.every(isHarness)
      ? cloneHarnesses(state.harnesses)
      : cloneHarnesses(sampleHarnesses);
  const selectedHarnessId =
    typeof state.selectedHarnessId === "string" &&
    harnesses.some((harness) => harness.id === state.selectedHarnessId)
      ? state.selectedHarnessId
      : null;

  return { harnesses, selectedHarnessId };
};

const createStarterHarness = (): Harness => {
  const createdAt = Date.now();
  const idMap = new Map(
    sampleHarnesses[0].nodes.map((node) => [node.id, `${node.type}-${createdAt}-${node.id}`]),
  );

  return {
    id: `harness-${createdAt}`,
    name: "Untitled Harness",
    description: "A new AI coding-agent harness draft.",
    contextPack: createEmptyContextPack(),
    nodes: sampleHarnesses[0].nodes.map((node) => ({
      ...node,
      notes: node.notes ?? "",
      promptBrief: createEmptyPromptBrief(),
      stepContract: createEmptyStepContract(),
      id: idMap.get(node.id) ?? node.id,
    })),
    edges: sampleHarnesses[0].edges.map((edge, index) => ({
      id: `edge-${createdAt}-${index}`,
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
    })),
    loops: [],
  };
};

const createId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const nodeDefaults: Record<HarnessNodeType, Pick<HarnessNode, "name" | "purpose">> = {
  task: {
    name: "New Task",
    purpose: "Define the work request and acceptance criteria.",
  },
  context: {
    name: "New Context",
    purpose: "Collect the files, references, and constraints the agent needs.",
  },
  agent: {
    name: "New Agent",
    purpose: "Perform the implementation or reasoning step for this harness.",
  },
  review: {
    name: "New Review",
    purpose: "Check the result for correctness, regressions, and missing verification.",
  },
  gate: {
    name: "New Gate",
    purpose: "Decide whether the flow can continue based on clear criteria.",
  },
};

const createHarnessNode = (type: HarnessNodeType, existingNodes: HarnessNode[]): HarnessNode => {
  const defaults = nodeDefaults[type];
  const index = existingNodes.length;

  return {
    id: createId(type),
    type,
    name: defaults.name,
    purpose: defaults.purpose,
    notes: "",
    promptBrief: createEmptyPromptBrief(),
    stepContract: createEmptyStepContract(),
    inputs: [],
    outputs: [],
    constraints: [],
    position: {
      x: 120 + (index % 3) * 280,
      y: 120 + Math.floor(index / 3) * 180,
    },
  };
};

export const useHarnessStore = create<HarnessStore>()(
  persist(
    (set) => ({
      harnesses: cloneHarnesses(sampleHarnesses),
      selectedHarnessId: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      selectHarness: (harnessId) =>
        set({ selectedHarnessId: harnessId, selectedNodeId: null, selectedEdgeId: null }),
      returnToList: () =>
        set({ selectedHarnessId: null, selectedNodeId: null, selectedEdgeId: null }),
      createHarness: () => {
        const harness = createStarterHarness();
        set((state) => ({
          harnesses: [harness, ...state.harnesses],
          selectedHarnessId: harness.id,
          selectedNodeId: null,
          selectedEdgeId: null,
        }));
        return harness.id;
      },
      selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
      selectEdge: (edgeId) =>
        set(edgeId ? { selectedEdgeId: edgeId, selectedNodeId: null } : { selectedEdgeId: null }),
      updateHarness: (updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId ? { ...harness, ...updates } : harness,
          ),
        })),
      updatePromptBrief: (nodeId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId
              ? {
                  ...harness,
                  nodes: harness.nodes.map((node) =>
                    node.id === nodeId
                      ? {
                          ...node,
                          promptBrief: {
                            ...normalizePromptBrief(node.promptBrief),
                            ...updates,
                          },
                        }
                      : node,
                  ),
                }
              : harness,
          ),
        })),
      updateStepContract: (nodeId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId
              ? {
                  ...harness,
                  nodes: harness.nodes.map((node) =>
                    node.id === nodeId
                      ? {
                          ...node,
                          stepContract: {
                            ...normalizeStepContract(node.stepContract, node),
                            ...updates,
                          },
                        }
                      : node,
                  ),
                }
              : harness,
          ),
        })),
      updateHandoffContract: (edgeId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId
              ? {
                  ...harness,
                  edges: harness.edges.map((edge) =>
                    edge.id === edgeId
                      ? {
                          ...edge,
                          handoff: {
                            ...(normalizeHandoffContract(edge.handoff) ??
                              createEmptyHandoffContract()),
                            ...updates,
                          },
                        }
                      : edge,
                  ),
                }
              : harness,
          ),
        })),
      addWorkflowLoop: () => {
        let nextLoopId: string | null = null;

        set((state) => ({
          harnesses: state.harnesses.map((harness) => {
            if (harness.id !== state.selectedHarnessId) {
              return harness;
            }

            const loop = createEmptyWorkflowLoop(createId("loop"));
            const firstNode = harness.nodes[0];
            nextLoopId = loop.id;

            return {
              ...harness,
              loops: [
                ...harness.loops,
                {
                  ...loop,
                  nodeIds: firstNode ? [firstNode.id] : [],
                  entryNodeId: firstNode?.id ?? "",
                },
              ],
            };
          }),
        }));

        return nextLoopId;
      },
      updateWorkflowLoop: (loopId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id !== state.selectedHarnessId
              ? harness
              : {
                  ...harness,
                  loops: harness.loops.map((loop) =>
                    loop.id === loopId ? { ...loop, ...updates } : loop,
                  ),
                },
          ),
        })),
      deleteWorkflowLoop: (loopId) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id !== state.selectedHarnessId
              ? harness
              : {
                  ...harness,
                  loops: harness.loops.filter((loop) => loop.id !== loopId),
                },
          ),
        })),
      updateContextPack: (updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId
              ? {
                  ...harness,
                  contextPack: {
                    ...normalizeContextPack(harness.contextPack),
                    ...updates,
                  },
                }
              : harness,
          ),
        })),
      addNode: (nodeType) => {
        let nextNodeId: string | null = null;

        set((state) => ({
          harnesses: state.harnesses.map((harness) => {
            if (harness.id !== state.selectedHarnessId) {
              return harness;
            }

            const node = createHarnessNode(nodeType, harness.nodes);
            nextNodeId = node.id;

            return {
              ...harness,
              nodes: [...harness.nodes, node],
            };
          }),
          selectedNodeId: nextNodeId,
          selectedEdgeId: null,
        }));

        return nextNodeId;
      },
      deleteNode: (nodeId) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id !== state.selectedHarnessId
              ? harness
              : {
                  ...harness,
                  nodes: harness.nodes.filter((node) => node.id !== nodeId),
                  edges: harness.edges.filter(
                    (edge) => edge.source !== nodeId && edge.target !== nodeId,
                  ),
                  loops: harness.loops.map((loop) => ({
                    ...loop,
                    nodeIds: loop.nodeIds.filter((loopNodeId) => loopNodeId !== nodeId),
                    entryNodeId: loop.entryNodeId === nodeId ? "" : loop.entryNodeId,
                    exitTargetNodeId:
                      loop.exitTargetNodeId === nodeId ? undefined : loop.exitTargetNodeId,
                  })),
                },
          ),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          selectedEdgeId:
            state.selectedEdgeId &&
            state.harnesses
              .find((harness) => harness.id === state.selectedHarnessId)
              ?.edges.some(
                (edge) =>
                  edge.id === state.selectedEdgeId &&
                  edge.source !== nodeId &&
                  edge.target !== nodeId,
              )
              ? state.selectedEdgeId
              : null,
        })),
      updateNode: (nodeId, updates) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id !== state.selectedHarnessId
              ? harness
              : {
                  ...harness,
                  nodes: harness.nodes.map((node) =>
                    node.id === nodeId ? { ...node, ...updates } : node,
                  ),
                },
          ),
        })),
      updateNodePosition: (nodeId, position) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id !== state.selectedHarnessId
              ? harness
              : {
                  ...harness,
                  nodes: harness.nodes.map((node) =>
                    node.id === nodeId ? { ...node, position } : node,
                  ),
                },
          ),
        })),
      setEdges: (edges) =>
        set((state) => ({
          harnesses: state.harnesses.map((harness) =>
            harness.id === state.selectedHarnessId
              ? {
                  ...harness,
                  edges: edges.map((edge) => {
                    const existingEdge = harness.edges.find(
                      (harnessEdge) => harnessEdge.id === edge.id,
                    );

                    return {
                      ...edge,
                      handoff:
                        edge.handoff ??
                        existingEdge?.handoff ??
                        (edge.source && edge.target ? createEmptyHandoffContract() : undefined),
                    };
                  }),
                }
              : harness,
          ),
          selectedEdgeId:
            state.selectedEdgeId && edges.some((edge) => edge.id === state.selectedEdgeId)
              ? state.selectedEdgeId
              : null,
        })),
      resetSampleData: () => {
        set({
          harnesses: cloneHarnesses(sampleHarnesses),
          selectedHarnessId: sampleHarnesses[0]?.id ?? null,
          selectedNodeId: null,
          selectedEdgeId: null,
        });
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state): PersistedHarnessState => ({
        harnesses: state.harnesses,
        selectedHarnessId: state.selectedHarnessId,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...getSafePersistedState(persistedState),
        selectedNodeId: null,
        selectedEdgeId: null,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      },
    },
  ),
);
