import { WorkflowGateScreen } from '@/components/workflow-gate-screen';

export default function MacroSharingScreen() {
  return (
    <WorkflowGateScreen
      eyebrow="WORKFLOW SHARING GATE"
      title="Workflow Sharing Is Paused"
      description="Sharing a local macro without workspace membership, permission checks, and durable copies is a tenant leak waiting for a name tag. This stays unavailable until those rules exist."
    />
  );
}
