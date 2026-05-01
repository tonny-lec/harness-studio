import type { NodeProps } from "@xyflow/react";
import type { HarnessNode } from "../../types/harness";
import { BaseHarnessNode } from "./BaseHarnessNode";

export function ContextNode(props: NodeProps) {
  return <BaseHarnessNode {...props} data={props.data as HarnessNode} tone="context" />;
}
