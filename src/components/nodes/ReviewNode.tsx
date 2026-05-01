import type { NodeProps } from "@xyflow/react";
import type { HarnessNode } from "../../types/harness";
import { BaseHarnessNode } from "./BaseHarnessNode";

export function ReviewNode(props: NodeProps) {
  return <BaseHarnessNode {...props} data={props.data as HarnessNode} tone="review" />;
}
