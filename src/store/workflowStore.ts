import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoopBlock, Step, StepKind, Workflow, WorkflowBlock } from "../types/workflow";
import { stepKindPresets } from "../data/stepKinds";
import { workflowTemplates } from "../data/templates";
import { createId } from "../utils/id";

const createStep = (kind: StepKind): Step => ({
  id: createId(),
  kind,
  name: stepKindPresets[kind].defaultName,
  instruction: "",
  expectedOutput: "",
  checklist: [],
});

const createEmptyWorkflow = (): Workflow => ({
  id: createId(),
  name: "新しいワークフロー",
  description: "",
  context: "",
  blocks: [],
});

type WorkflowStore = {
  workflows: Workflow[];
  selectedWorkflowId: string | null;

  selectWorkflow: (workflowId: string | null) => void;
  createWorkflow: (templateId?: string) => string;
  importWorkflow: (workflow: Workflow) => string;
  duplicateWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;
  updateWorkflowMeta: (
    workflowId: string,
    patch: Partial<Pick<Workflow, "name" | "description" | "context">>,
  ) => void;

  addStepBlock: (workflowId: string, kind: StepKind, afterBlockId?: string) => string;
  addLoopBlock: (workflowId: string, afterBlockId?: string) => string;
  moveBlock: (workflowId: string, blockId: string, direction: "up" | "down") => void;
  deleteBlock: (workflowId: string, blockId: string) => void;
  updateLoop: (
    workflowId: string,
    blockId: string,
    patch: Partial<Pick<LoopBlock, "name" | "maxIterations" | "exitCondition">>,
  ) => void;

  addStepToLoop: (workflowId: string, blockId: string, kind: StepKind) => string;
  moveStepInLoop: (
    workflowId: string,
    blockId: string,
    stepId: string,
    direction: "up" | "down",
  ) => void;
  deleteStepInLoop: (workflowId: string, blockId: string, stepId: string) => void;

  updateStep: (workflowId: string, stepId: string, patch: Partial<Omit<Step, "id">>) => void;
};

const moveItem = <T>(items: T[], index: number, direction: "up" | "down"): T[] => {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const insertAfter = (
  blocks: WorkflowBlock[],
  block: WorkflowBlock,
  afterBlockId?: string,
): WorkflowBlock[] => {
  if (!afterBlockId) {
    return [...blocks, block];
  }
  const index = blocks.findIndex((candidate) => candidate.id === afterBlockId);
  if (index < 0) {
    return [...blocks, block];
  }
  return [...blocks.slice(0, index + 1), block, ...blocks.slice(index + 1)];
};

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => {
      const updateWorkflow = (workflowId: string, update: (workflow: Workflow) => Workflow) => {
        set((state) => ({
          workflows: state.workflows.map((workflow) =>
            workflow.id === workflowId ? update(workflow) : workflow,
          ),
        }));
      };

      return {
        workflows: workflowTemplates.slice(0, 1).map((template) => template.build()),
        selectedWorkflowId: null,

        selectWorkflow: (workflowId) => set({ selectedWorkflowId: workflowId }),

        createWorkflow: (templateId) => {
          const template = workflowTemplates.find((candidate) => candidate.id === templateId);
          const workflow = template ? template.build() : createEmptyWorkflow();
          set((state) => ({
            workflows: [...state.workflows, workflow],
            selectedWorkflowId: workflow.id,
          }));
          return workflow.id;
        },

        importWorkflow: (workflow) => {
          const imported: Workflow = { ...workflow, id: createId() };
          set((state) => ({
            workflows: [...state.workflows, imported],
            selectedWorkflowId: imported.id,
          }));
          return imported.id;
        },

        duplicateWorkflow: (workflowId) => {
          const source = get().workflows.find((workflow) => workflow.id === workflowId);
          if (!source) {
            return;
          }
          const copy: Workflow = {
            ...structuredClone(source),
            id: createId(),
            name: `${source.name} のコピー`,
          };
          set((state) => ({ workflows: [...state.workflows, copy] }));
        },

        deleteWorkflow: (workflowId) =>
          set((state) => ({
            workflows: state.workflows.filter((workflow) => workflow.id !== workflowId),
            selectedWorkflowId:
              state.selectedWorkflowId === workflowId ? null : state.selectedWorkflowId,
          })),

        updateWorkflowMeta: (workflowId, patch) =>
          updateWorkflow(workflowId, (workflow) => ({ ...workflow, ...patch })),

        addStepBlock: (workflowId, kind, afterBlockId) => {
          const block: WorkflowBlock = { id: createId(), type: "step", step: createStep(kind) };
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: insertAfter(workflow.blocks, block, afterBlockId),
          }));
          return block.id;
        },

        addLoopBlock: (workflowId, afterBlockId) => {
          const block: WorkflowBlock = {
            id: createId(),
            type: "loop",
            name: "繰り返しブロック",
            steps: [createStep("generate"), createStep("gate")],
            maxIterations: 3,
            exitCondition: "",
          };
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: insertAfter(workflow.blocks, block, afterBlockId),
          }));
          return block.id;
        },

        moveBlock: (workflowId, blockId, direction) =>
          updateWorkflow(workflowId, (workflow) => {
            const index = workflow.blocks.findIndex((block) => block.id === blockId);
            return { ...workflow, blocks: moveItem(workflow.blocks, index, direction) };
          }),

        deleteBlock: (workflowId, blockId) =>
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.filter((block) => block.id !== blockId),
          })),

        updateLoop: (workflowId, blockId, patch) =>
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.map((block) =>
              block.id === blockId && block.type === "loop" ? { ...block, ...patch } : block,
            ),
          })),

        addStepToLoop: (workflowId, blockId, kind) => {
          const step = createStep(kind);
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.map((block) =>
              block.id === blockId && block.type === "loop"
                ? { ...block, steps: [...block.steps, step] }
                : block,
            ),
          }));
          return step.id;
        },

        moveStepInLoop: (workflowId, blockId, stepId, direction) =>
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.map((block) => {
              if (block.id !== blockId || block.type !== "loop") {
                return block;
              }
              const index = block.steps.findIndex((step) => step.id === stepId);
              return { ...block, steps: moveItem(block.steps, index, direction) };
            }),
          })),

        deleteStepInLoop: (workflowId, blockId, stepId) =>
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.map((block) =>
              block.id === blockId && block.type === "loop"
                ? { ...block, steps: block.steps.filter((step) => step.id !== stepId) }
                : block,
            ),
          })),

        updateStep: (workflowId, stepId, patch) =>
          updateWorkflow(workflowId, (workflow) => ({
            ...workflow,
            blocks: workflow.blocks.map((block) => {
              if (block.type === "step") {
                return block.step.id === stepId
                  ? { ...block, step: { ...block.step, ...patch } }
                  : block;
              }
              return {
                ...block,
                steps: block.steps.map((step) =>
                  step.id === stepId ? { ...step, ...patch } : step,
                ),
              };
            }),
          })),
      };
    },
    {
      name: "harness-studio-v2",
      version: 2,
    },
  ),
);
