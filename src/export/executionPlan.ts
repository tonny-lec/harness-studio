import type { Harness, HarnessNode, WorkflowLoop } from "../types/harness";

export type ExecutionUnit =
  | { kind: "node"; nodeId: string }
  | {
      kind: "loop";
      loopId: string;
      name: string;
      nodeIds: string[];
      maxIterations: number;
      exitConditions: string[];
      exitTargetNodeId?: string;
    };

export type ExecutionPlan = {
  units: ExecutionUnit[];
};

const dedupe = (ids: string[]) => Array.from(new Set(ids));

const loopForNode = (harness: Harness, nodeId: string): WorkflowLoop | undefined =>
  harness.loops.find((loop) => loop.nodeIds.includes(nodeId));

const orderLoopMembers = (harness: Harness, loop: WorkflowLoop): string[] => {
  const members = dedupe(loop.nodeIds).filter((id) => harness.nodes.some((node) => node.id === id));
  if (members.length <= 1) {
    return members;
  }

  const memberSet = new Set(members);
  const adjacency = new Map<string, string[]>();
  members.forEach((id) => adjacency.set(id, []));
  harness.edges.forEach((edge) => {
    if (memberSet.has(edge.source) && memberSet.has(edge.target) && edge.source !== edge.target) {
      adjacency.get(edge.source)?.push(edge.target);
    }
  });

  const start = memberSet.has(loop.entryNodeId) ? loop.entryNodeId : members[0];
  const ordered: string[] = [];
  const visited = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    ordered.push(id);
    (adjacency.get(id) ?? []).forEach(visit);
  };
  visit(start);
  members.forEach((id) => visit(id));
  return ordered;
};

/**
 * Collapses every workflow loop into a single execution unit, then orders all
 * units with a topological sort over the remaining edges. Cycles that survive
 * loop collapsing fall back to canvas declaration order so the plan always
 * covers every node exactly once.
 */
export function buildExecutionPlan(harness: Harness): ExecutionPlan {
  type UnitRecord = { key: string; unit: ExecutionUnit; firstIndex: number };
  const unitByKey = new Map<string, UnitRecord>();
  const unitKeyForNode = new Map<string, string>();

  harness.nodes.forEach((node, position) => {
    const loop = loopForNode(harness, node.id);
    const key = loop ? `loop:${loop.id}` : `node:${node.id}`;
    unitKeyForNode.set(node.id, key);
    if (unitByKey.has(key)) {
      return;
    }
    unitByKey.set(key, {
      key,
      firstIndex: position,
      unit: loop
        ? {
            kind: "loop",
            loopId: loop.id,
            name: loop.name,
            nodeIds: orderLoopMembers(harness, loop),
            maxIterations: loop.maxIterations,
            exitConditions: loop.exitConditions,
            exitTargetNodeId: loop.exitTargetNodeId || undefined,
          }
        : { kind: "node", nodeId: node.id },
    });
  });

  const records = Array.from(unitByKey.values());
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  records.forEach((record) => {
    incoming.set(record.key, new Set());
    outgoing.set(record.key, new Set());
  });

  harness.edges.forEach((edge) => {
    const sourceKey = unitKeyForNode.get(edge.source);
    const targetKey = unitKeyForNode.get(edge.target);
    if (!sourceKey || !targetKey || sourceKey === targetKey) {
      return;
    }
    outgoing.get(sourceKey)?.add(targetKey);
    incoming.get(targetKey)?.add(sourceKey);
  });

  const remaining = new Set(records.map((record) => record.key));
  const ordered: UnitRecord[] = [];
  while (remaining.size > 0) {
    const ready = records
      .filter((record) => remaining.has(record.key))
      .filter((record) =>
        Array.from(incoming.get(record.key) ?? []).every((dep) => !remaining.has(dep)),
      )
      .sort((a, b) => a.firstIndex - b.firstIndex);

    // Cycle between units: fall back to declaration order for the rest.
    const next =
      ready[0] ??
      records
        .filter((record) => remaining.has(record.key))
        .sort((a, b) => a.firstIndex - b.firstIndex)[0];
    remaining.delete(next.key);
    ordered.push(next);
  }

  return { units: ordered.map((record) => record.unit) };
}

export function planNodeIds(plan: ExecutionPlan): string[] {
  return plan.units.flatMap((unit) => (unit.kind === "node" ? [unit.nodeId] : unit.nodeIds));
}

export function findNode(harness: Harness, nodeId: string): HarnessNode | undefined {
  return harness.nodes.find((node) => node.id === nodeId);
}

const FILE_SAFE_PATTERN = /[^a-z0-9-]+/g;

/** Builds a filesystem-safe slug; falls back to the node id when the name has no ASCII. */
export function fileSlug(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(FILE_SAFE_PATTERN, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || fallback.toLowerCase().replace(FILE_SAFE_PATTERN, "-");
}

export type HarnessExportJson = {
  formatVersion: 1;
  generator: "harness-studio";
  harness: Harness;
  executionPlan: ExecutionPlan;
};

export function buildHarnessExportJson(harness: Harness): HarnessExportJson {
  return {
    formatVersion: 1,
    generator: "harness-studio",
    harness,
    executionPlan: buildExecutionPlan(harness),
  };
}
