import { WorkflowGateScreen } from '@/components/workflow-gate-screen';

export default function MacroChainingScreen() {
  return (
    <WorkflowGateScreen
      eyebrow="WORKFLOW CHAINING GATE"
      title="Workflow Chaining Is Paused"
      description="Chaining local macro records into a pretend execution plan is not safe orchestration. The chain builder returns only after real tenant-scoped workflow execution exists."
    />
  );
}
