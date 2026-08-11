import { WorkflowGateScreen } from '@/components/workflow-gate-screen';

export default function MacroEditorScreen() {
  return (
    <WorkflowGateScreen
      eyebrow="MACRO EDITOR GATE"
      title="Local Macro Editing Is Paused"
      description="Editing a macro in device-local state does not create a tenant-safe workflow. The editor returns when its saves, tools, and execution records belong to the current workspace."
    />
  );
}
