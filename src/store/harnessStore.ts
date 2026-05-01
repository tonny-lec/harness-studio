import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ContextPack,
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessNodeType,
  PromptBrief,
  StepContract,
} from "../types/harness";
import { sampleHarnesses } from "../data/sampleHarnesses";
import { createEmptyContextPack, normalizeContextPack } from "../utils/contextPack";
import { createEmptyPromptBrief, normalizePromptBrief } from "../utils/promptBrief";
import { createEmptyStepContract, normalizeEdgeHandoff, normalizeStepContract } from "../utils/stepContract";

const STORAGE_KEY = "harness-studio-state";

type HarnessStore = {
  harnesses: Harness[];
  selectedHarnessId: string | null;
  selectedNodeId: string | null;
  selectHarness: (harnessId: string) => void;
  returnToList: () => void;
  createHarness: () => string;
  selectNode: (nodeId: string | null) => void;
  updateHarness: (updates: Pick<Partial<Harness>, "name" | "description">) => void;
  updatePromptBrief: (nodeId: string, updates: Partial<PromptBrief>) => void;
  updateStepContract: (nodeId: string, updates: Partial<StepContract>) => void;
  updateContextPack: (updates: Partial<ContextPack>) => void;
  addNode: (nodeType: HarnessNodeType) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<Omit<HarnessNode, "id" | "type">>) => void;
  updateNodePosition: (nodeId: string, position: HarnessNode["position"]) => void;
  setEdges: (edges: HarnessEdge[]) => void;
  resetSampleData: () => void;
};

type PersistedHarnessState = Pick<HarnessStore, "harnesses" | "selectedHarnessId">;

const cloneHarnesses = (harnesses: Harness[]) =>
  harnesses.map((harness) => {
    const { promptBrief: legacyPromptBrief, ...baseHarness } = harness as Harness & {
      promptBrief?: unknown;
    };
    const legacyBrief = normalizePromptBrief(legacyPromptBrief);
    let didApplyLegacyBrief = false;

    return {
      ...baseHarness,
      contextPack: normalizeContextPack(harness.contextPack),
      nodes: harness.nodes.map((node) => {
        const nodeBrief = normalizePromptBrief((node as unknown as { promptBrief?: unknown }).promptBrief);
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
          stepContract: normalizeStepContract((node as unknown as { stepContract?: unknown }).stepContract, node),
          inputs: [...node.inputs],
          outputs: [...node.outputs],
          constraints: [...node.constraints],
          position: { ...node.position },
        };
      }),
      edges: harness.edges.map(normalizeEdgeHandoff),
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
  return typeof edge.id === "string" && typeof edge.source === "string" && typeof edge.target === "string";
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
    harness.edges.every(isHarnessEdge)
  );
};

const getSafePersistedState = (persistedState: unknown): PersistedHarnessState => {
  if (!persistedState || typeof persistedState !== "object") {
    return { harnesses: cloneHarnesses(sampleHarnesses), selectedHarnessId: null };
  }

  const state = persistedState as Record<string, unknown>;
  const harnesses = Array.isArray(state.harnesses) && state.harnesses.every(isHarness)
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
      selectHarness: (harnessId) => set({ selectedHarnessId: harnessId, selectedNodeId: null }),
      returnToList: () => set({ selectedHarnessId: null, selectedNodeId: null }),
      createHarness: () => {
        const harness = createStarterHarness();
        set((state) => ({
          harnesses: [harness, ...state.harnesses],
          selectedHarnessId: harness.id,
          selectedNodeId: null,
        }));
        return harness.id;
      },
      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
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
                },
          ),
          selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
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
            harness.id === state.selectedHarnessId ? { ...harness, edges } : harness,
          ),
        })),
      resetSampleData: () => {
        set({
          harnesses: cloneHarnesses(sampleHarnesses),
          selectedHarnessId: sampleHarnesses[0]?.id ?? null,
          selectedNodeId: null,
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
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      },
    },
  ),
);
