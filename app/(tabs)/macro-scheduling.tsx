import { WorkflowGateScreen } from '@/components/workflow-gate-screen';

export default function MacroSchedulingScreen() {
  return (
    <WorkflowGateScreen
      eyebrow="SCHEDULING GATE"
      title="Workflow Scheduling Is Paused"
      description="No device-local timer gets to masquerade as a reliable automation service. Scheduling returns only with durable workflow state, ownership checks, and execution audit records."
    />
  );
}
