import type {
  ContextPack,
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessValidationIssue,
  HandoffContract,
  StepContract,
  ValidationSeverity,
  WorkflowLoop,
} from "../types/harness";

const hasText = (value: string | undefined) => Boolean(value?.trim());

const hasItems = (items: string[]) => items.some((item) => hasText(item));

const isContextPackEmpty = (contextPack: ContextPack) =>
  !hasItems(contextPack.projectFacts) &&
  !hasItems(contextPack.domainNotes) &&
  !hasItems(contextPack.sourceMap) &&
  !hasItems(contextPack.conventions) &&
  !hasItems(contextPack.reusableConstraints) &&
  !hasItems(contextPack.validationCommands) &&
  !hasItems(contextPack.knownRisks);

const hasStepContractContent = (stepContract: StepContract) =>
  hasItems(stepContract.requiredInputs) ||
  hasItems(stepContract.producedArtifacts) ||
  hasItems(stepContract.allowedActions) ||
  hasItems(stepContract.qualityGates) ||
  hasItems(stepContract.handoffNotes) ||
  hasItems(stepContract.failureModes);

const hasHandoffContent = (handoff: HandoffContract | undefined) =>
  Boolean(
    handoff &&
    (hasItems(handoff.transferredArtifacts) ||
      hasItems(handoff.conditions) ||
      hasText(handoff.notes)),
  );

const issue = (
  id: string,
  severity: ValidationSeverity,
  scope: HarnessValidationIssue["scope"],
  title: string,
  message: string,
  recommendation?: string,
  targetId?: string,
): HarnessValidationIssue => ({
  id,
  severity,
  scope,
  targetId,
  title,
  message,
  recommendation,
});

const normalizedSet = (items: string[]) =>
  new Set(items.filter(hasText).map((item) => item.trim().toLocaleLowerCase()));

const findNode = (nodes: HarnessNode[], nodeId: string) => nodes.find((node) => node.id === nodeId);

const hasValidMaxIterations = (loop: WorkflowLoop) =>
  typeof loop.maxIterations === "number" &&
  Number.isInteger(loop.maxIterations) &&
  loop.maxIterations > 0;

const includesConnectedSequence = (loop: WorkflowLoop, edges: HarnessEdge[]) => {
  if (loop.nodeIds.length < 2) {
    return true;
  }

  return loop.nodeIds
    .slice(0, -1)
    .every((nodeId, index) =>
      edges.some((edge) => edge.source === nodeId && edge.target === loop.nodeIds[index + 1]),
    );
};

const validateNode = (node: HarnessNode): HarnessValidationIssue[] => {
  const issues: HarnessValidationIssue[] = [];

  if (!hasText(node.promptBrief.goal)) {
    issues.push(
      issue(
        `node-${node.id}-prompt-goal`,
        "warning",
        "node",
        "Prompt Brief の Goal が未入力です",
        `${node.name} でCodexに何を達成してほしいかが定義されていません。`,
        "選択中NodeのPrompt Briefに短いGoalを追加してください。",
        node.id,
      ),
    );
  }

  if (!hasItems(node.promptBrief.successCriteria)) {
    issues.push(
      issue(
        `node-${node.id}-success-criteria`,
        "warning",
        "node",
        "Success Criteria が未入力です",
        `${node.name} の完了条件が定義されていません。`,
        "このStepのDefinition of Doneが分かるようにSuccess Criteriaを追加してください。",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.requiredInputs)) {
    issues.push(
      issue(
        `node-${node.id}-required-inputs`,
        "warning",
        "node",
        "Required Inputs が未入力です",
        `${node.name} が作業開始前に必要とする入力が定義されていません。`,
        "NodeのStep ContractにRequired Inputsを追加してください。",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.producedArtifacts)) {
    issues.push(
      issue(
        `node-${node.id}-produced-artifacts`,
        "warning",
        "node",
        "Produced Artifacts が未入力です",
        `${node.name} が後続Stepへ渡す成果物が定義されていません。`,
        "NodeのStep ContractにProduced Artifactsを追加してください。",
        node.id,
      ),
    );
  }

  if (!hasItems(node.stepContract.qualityGates)) {
    issues.push(
      issue(
        `node-${node.id}-quality-gates`,
        "warning",
        "node",
        "Quality Gates が未入力です",
        `${node.name} の検証条件または受け入れ条件が定義されていません。`,
        "NodeのStep ContractにQuality Gatesを追加してください。",
        node.id,
      ),
    );
  }

  return issues;
};

const validateEdge = (edge: HarnessEdge, nodes: HarnessNode[]): HarnessValidationIssue[] => {
  const issues: HarnessValidationIssue[] = [];
  const source = findNode(nodes, edge.source);
  const target = findNode(nodes, edge.target);
  const handoff = edge.handoff;
  const sourceHasContract = source ? hasStepContractContent(source.stepContract) : false;
  const targetHasContract = target ? hasStepContractContent(target.stepContract) : false;
  const sourceName = source?.name ?? edge.source;
  const targetName = target?.name ?? edge.target;

  if (!hasHandoffContent(handoff)) {
    issues.push(
      issue(
        `edge-${edge.id}-handoff`,
        sourceHasContract && targetHasContract ? "warning" : "info",
        "edge",
        "Handoff Contract が未設定です",
        `${sourceName} -> ${targetName} の接続で何を引き継ぐかが定義されていません。`,
        "このedgeが意味のある作業成果を渡す場合は、引き継ぐ成果物、条件、メモを追加してください。",
        edge.id,
      ),
    );
  }

  if (handoff && !hasItems(handoff.transferredArtifacts)) {
    issues.push(
      issue(
        `edge-${edge.id}-transferred-artifacts`,
        "warning",
        "edge",
        "引き継ぐ成果物が未設定です",
        `${sourceName} -> ${targetName} のHandoff Contractにtransferred artifactsがありません。`,
        "次のStepへ渡す成果物、判断、調査結果、指示を記述してください。",
        edge.id,
      ),
    );
  }

  if (handoff?.kind === "conditional" && !hasItems(handoff.conditions)) {
    issues.push(
      issue(
        `edge-${edge.id}-conditional-conditions`,
        "warning",
        "edge",
        "Conditional connection の条件が未入力です",
        `${sourceName} -> ${targetName} はConditionalですが、この接続を使う条件が定義されていません。`,
        "Conditionsに、この接続を選ぶ判断条件を追加してください。",
        edge.id,
      ),
    );
  }

  if (
    source &&
    target &&
    hasItems(source.stepContract.producedArtifacts) &&
    hasItems(target.stepContract.requiredInputs)
  ) {
    const produced = normalizedSet(source.stepContract.producedArtifacts);
    const hasExactMatch = target.stepContract.requiredInputs.some((input) =>
      produced.has(input.trim().toLocaleLowerCase()),
    );

    if (!hasExactMatch) {
      issues.push(
        issue(
          `edge-${edge.id}-input-artifact-match`,
          "info",
          "edge",
          "Required input と上流成果物が一致していない可能性があります",
          `${targetName} のRequired Inputsが、${sourceName} のProduced Artifactsと完全一致していません。これは簡易的な判定で、手動確認が必要な場合があります。`,
          "意図した引き継ぎであればartifact名を揃えるか、Handoff Notesで対応関係を説明してください。",
          edge.id,
        ),
      );
    }
  }

  return issues;
};

const validateLoop = (
  loop: WorkflowLoop,
  nodes: HarnessNode[],
  edges: HarnessEdge[],
): HarnessValidationIssue[] => {
  const issues: HarnessValidationIssue[] = [];
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (loop.nodeIds.length === 0) {
    issues.push(
      issue(
        `loop-${loop.id}-no-nodes`,
        "warning",
        "loop",
        "Workflow Loop にNodeが含まれていません",
        `${loop.name} は反復対象のWorkflow Stepを持っていません。`,
        "Loopに含めるNodeを1つ以上選択してください。",
        loop.id,
      ),
    );
  }

  if (!loop.entryNodeId || !nodeIds.has(loop.entryNodeId)) {
    issues.push(
      issue(
        `loop-${loop.id}-entry-node`,
        "warning",
        "loop",
        "Workflow Loop の開始Nodeが不正です",
        `${loop.name} のentry nodeが未設定、または存在しないNodeを参照しています。`,
        "Entry NodeにLoop内の開始Stepを設定してください。",
        loop.id,
      ),
    );
  }

  if (loop.exitTargetNodeId && !nodeIds.has(loop.exitTargetNodeId)) {
    issues.push(
      issue(
        `loop-${loop.id}-exit-target`,
        "warning",
        "loop",
        "Workflow Loop の終了先Nodeが不正です",
        `${loop.name} のexit target nodeが存在しないNodeを参照しています。`,
        "Exit Target Nodeを現在のHarness内のNodeに変更してください。",
        loop.id,
      ),
    );
  }

  if (!hasValidMaxIterations(loop)) {
    issues.push(
      issue(
        `loop-${loop.id}-max-iterations`,
        "warning",
        "loop",
        "Workflow Loop の最大反復回数が未設定です",
        `${loop.name} のmax iterationsが有効な正の整数として設定されていません。`,
        "Max Iterationsに、Loopを何回まで許容するかを設定してください。",
        loop.id,
      ),
    );
  }

  if (!hasItems(loop.exitConditions)) {
    issues.push(
      issue(
        `loop-${loop.id}-exit-conditions`,
        "warning",
        "loop",
        "Workflow Loop の終了条件が未入力です",
        `${loop.name} は、どの条件でLoopを抜けるかが定義されていません。`,
        "Exit ConditionsにLoopを終了する条件を追加してください。",
        loop.id,
      ),
    );
  }

  if (!hasItems(loop.loopArtifacts)) {
    issues.push(
      issue(
        `loop-${loop.id}-artifacts`,
        "info",
        "loop",
        "Workflow Loop の反復成果物が未入力です",
        `${loop.name} は、反復間で何を引き継ぐかが定義されていません。`,
        "Loop Artifactsに、反復間で渡す成果物や判断を追加してください。",
        loop.id,
      ),
    );
  }

  if (!includesConnectedSequence(loop, edges)) {
    issues.push(
      issue(
        `loop-${loop.id}-connected-sequence`,
        "info",
        "loop",
        "Workflow Loop 内のNodeがedge flowでつながっていない可能性があります",
        `${loop.name} に含まれるNodeが、通常のedge flow上で連続した流れに見えません。これは簡易判定です。`,
        "Loopに含めるNode、または通常edgeの接続を確認してください。",
        loop.id,
      ),
    );
  }

  return issues;
};

export function validateHarness(harness: Harness): HarnessValidationIssue[] {
  const issues: HarnessValidationIssue[] = [];

  if (isContextPackEmpty(harness.contextPack)) {
    issues.push(
      issue(
        "harness-empty-context-pack",
        "warning",
        "harness",
        "Context Pack が空です",
        "このハーネスには再利用可能なプロジェクト・ドメイン知識がありません。",
        "各NodeのPromptで同じ説明を繰り返さなくてよいように、再利用可能な前提知識を追加してください。",
      ),
    );
  }

  if (harness.nodes.length === 0) {
    issues.push(
      issue(
        "harness-no-nodes",
        "error",
        "harness",
        "Workflow Step がありません",
        "このハーネスにはプロンプト実行単位となるWorkflow Stepがありません。",
        "少なくとも1つのWorkflow Stepを追加してください。",
      ),
    );
  }

  if (harness.nodes.length > 1 && harness.edges.length === 0) {
    issues.push(
      issue(
        "harness-unconnected-steps",
        "warning",
        "harness",
        "Workflow Step が接続されていません",
        "複数のWorkflow Stepがありますが、handoff flowが定義されていません。",
        "Step同士を接続して、成果物や判断の引き継ぎ流れを表してください。",
      ),
    );
  }

  harness.nodes.forEach((node) => {
    issues.push(...validateNode(node));
  });

  harness.edges.forEach((edge) => {
    issues.push(...validateEdge(edge, harness.nodes));
  });

  harness.loops.forEach((loop) => {
    issues.push(...validateLoop(loop, harness.nodes, harness.edges));
  });

  return issues;
}
