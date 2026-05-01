import type {
  ContextPack,
  Harness,
  HarnessEdge,
  HarnessNode,
  HarnessValidationIssue,
  HandoffContract,
  StepContract,
  ValidationSeverity,
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
      hasItems(handoff.stopConditions) ||
      hasText(handoff.notes) ||
      hasText(handoff.failureBehavior)),
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

const hasValidMaxIterations = (handoff: HandoffContract) =>
  typeof handoff.maxIterations === "number" &&
  Number.isInteger(handoff.maxIterations) &&
  handoff.maxIterations > 0;

const returnsToUpstreamStep = (edge: HarnessEdge, edges: HarnessEdge[]) => {
  if (edge.source === edge.target) {
    return true;
  }

  const visited = new Set<string>();
  const stack = [edge.target];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();

    if (!currentNodeId || visited.has(currentNodeId)) {
      continue;
    }

    if (currentNodeId === edge.source) {
      return true;
    }

    visited.add(currentNodeId);
    edges
      .filter(
        (candidateEdge) => candidateEdge.id !== edge.id && candidateEdge.source === currentNodeId,
      )
      .forEach((candidateEdge) => stack.push(candidateEdge.target));
  }

  return false;
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

const validateEdge = (
  edge: HarnessEdge,
  nodes: HarnessNode[],
  edges: HarnessEdge[],
): HarnessValidationIssue[] => {
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

  if (handoff?.kind === "loop") {
    if (!hasValidMaxIterations(handoff)) {
      issues.push(
        issue(
          `edge-${edge.id}-loop-max-iterations`,
          "warning",
          "edge",
          "Loop の最大反復回数が未設定です",
          `${sourceName} -> ${targetName} はLoopですが、max iterationsが有効な正の整数として設定されていません。`,
          "Max Iterationsに、ループを何回まで許容するかを設定してください。",
          edge.id,
        ),
      );
    }

    if (!hasItems(handoff.stopConditions)) {
      issues.push(
        issue(
          `edge-${edge.id}-loop-stop-conditions`,
          "warning",
          "edge",
          "Loop の停止条件が未入力です",
          `${sourceName} -> ${targetName} はLoopですが、いつ反復を止めるかが定義されていません。`,
          "Stop Conditionsに、成功時・上限到達時・継続不能時の停止条件を追加してください。",
          edge.id,
        ),
      );
    }

    if (returnsToUpstreamStep(edge, edges) && !hasItems(handoff.stopConditions)) {
      issues.push(
        issue(
          `edge-${edge.id}-loop-return-stop-condition`,
          "warning",
          "edge",
          "上流へ戻るLoopに停止条件がありません",
          `${sourceName} -> ${targetName} は同じStepまたは上流Stepへ戻るLoopとして見えますが、停止条件がありません。`,
          "無限ループを避けるため、Stop Conditionsを明示してください。",
          edge.id,
        ),
      );
    }
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
    issues.push(...validateEdge(edge, harness.nodes, harness.edges));
  });

  return issues;
}
