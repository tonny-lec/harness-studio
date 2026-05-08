export type HarnessNodeType = "task" | "context" | "agent" | "review" | "gate";

export type PromptBrief = {
  goal: string;
  successCriteria: string[];
  availableContext: string[];
  constraints: string[];
  validation: string[];
  output: string[];
  stopRules: string[];
};

export type ContextPack = {
  projectFacts: string[];
  domainNotes: string[];
  sourceMap: string[];
  conventions: string[];
  reusableConstraints: string[];
  validationCommands: string[];
  knownRisks: string[];
};

export type StepContract = {
  requiredInputs: string[];
  producedArtifacts: string[];
  allowedActions: string[];
  qualityGates: string[];
  handoffNotes: string[];
  failureModes: string[];
};

export type EdgeKind = "normal" | "conditional";

export type HandoffContract = {
  kind: EdgeKind;
  transferredArtifacts: string[];
  conditions: string[];
  notes: string;
};

export type WorkflowLoop = {
  id: string;
  name: string;
  nodeIds: string[];
  entryNodeId: string;
  exitTargetNodeId?: string;
  maxIterations: number;
  exitConditions: string[];
  loopArtifacts: string[];
  notes?: string;
};

export type Harness = {
  id: string;
  name: string;
  description: string;
  contextPack: ContextPack;
  nodes: HarnessNode[];
  edges: HarnessEdge[];
  loops: WorkflowLoop[];
};

export type HarnessNode = {
  id: string;
  type: HarnessNodeType;
  name: string;
  purpose: string;
  notes?: string;
  promptBrief: PromptBrief;
  stepContract: StepContract;
  inputs: string[];
  outputs: string[];
  constraints: string[];
  position: { x: number; y: number };
};

export type HarnessEdge = {
  id: string;
  source: string;
  target: string;
  handoff?: HandoffContract;
};

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationScope = "harness" | "contextPack" | "node" | "edge" | "workflowLoop";

export type HarnessValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  scope: ValidationScope;
  targetId?: string;
  title: string;
  message: string;
  recommendation?: string;
};
