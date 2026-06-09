import { useWorkflowStore } from "./store/workflowStore";
import { HomeScreen } from "./components/HomeScreen";
import { BuilderScreen } from "./components/BuilderScreen";

export default function App() {
  const { workflows, selectedWorkflowId } = useWorkflowStore();
  const selectedWorkflow = workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null;

  if (!selectedWorkflow) {
    return <HomeScreen />;
  }

  return <BuilderScreen workflow={selectedWorkflow} />;
}
