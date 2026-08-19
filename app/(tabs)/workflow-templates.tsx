import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function WorkflowTemplatesScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: drafts = [], isLoading } = trpc.workflows.list.useQuery();
  const create = trpc.workflows.create.useMutation({ onSuccess: () => utils.workflows.list.invalidate() });
  const save = trpc.workflows.save.useMutation({ onSuccess: () => utils.workflows.list.invalidate() });
  const remove = trpc.workflows.delete.useMutation({ onSuccess: () => utils.workflows.list.invalidate() });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || save.isPending || remove.isPending;

  const createDraft = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await create.mutateAsync({ name: name.trim(), description: description.trim() || undefined, definition: { version: 1, steps: [] } });
      setName("");
      setDescription("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The workflow draft could not be saved."); }
  };

  const saveDraft = async (workflowId: string) => {
    if (!name.trim()) return;
    setError(null);
    try {
      await save.mutateAsync({ workflowId, name: name.trim(), description: description.trim() || undefined });
      setEditingId(null);
      setName("");
      setDescription("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The workflow draft could not be updated."); }
  };

  const editDraft = (draft: (typeof drafts)[number]) => {
    setEditingId(draft.id);
    setName(draft.name);
    setDescription(draft.description ?? "");
    setError(null);
  };

  const cancelEdit = () => { setEditingId(null); setName(""); setDescription(""); };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-primary px-6 py-8"><Text className="text-xs text-background/70 font-bold tracking-widest mb-2">WORKFLOW FOUNDATION</Text><Text className="text-4xl font-bold text-background mb-2">Draft the plan. Don’t fake the run.</Text><Text className="text-base text-background/90 leading-relaxed">Your workspace can now retain its workflow ideas and metadata. Execution has no cute little lie button: it stays unavailable until authorized tools, retries, and audit records exist.</Text></View>
        <View className="px-5 py-6 gap-5">
          {error ? <View className="bg-error rounded-xl px-4 py-3"><Text className="text-sm text-background">{error}</Text></View> : null}
          <View className="bg-surface rounded-2xl border border-border p-5 gap-3"><Text className="text-lg font-bold text-foreground">{editingId ? "Edit workflow draft" : "Create workflow draft"}</Text><TextInput value={name} onChangeText={setName} placeholder="Workflow name" placeholderTextColor={colors.muted} editable={!busy} className="bg-background text-foreground rounded-lg border border-border px-3 py-3" /><TextInput value={description} onChangeText={setDescription} placeholder="What should this workflow eventually accomplish?" placeholderTextColor={colors.muted} editable={!busy} multiline className="bg-background text-foreground rounded-lg border border-border px-3 py-3 min-h-20" /><Text className="text-xs text-muted">This creates a durable draft only. It does not schedule, resolve tools, or execute anything.</Text><View className="flex-row gap-3"><TouchableOpacity onPress={editingId ? () => saveDraft(editingId) : createDraft} disabled={!name.trim() || busy} className={cn("flex-1 rounded-lg py-3 items-center", name.trim() && !busy ? "bg-primary" : "bg-muted opacity-50")}><Text className="font-semibold text-background">{editingId ? "Save changes" : "Save draft"}</Text></TouchableOpacity>{editingId ? <TouchableOpacity onPress={cancelEdit} disabled={busy} className="rounded-lg px-4 py-3 border border-border"><Text className="font-semibold text-foreground">Cancel</Text></TouchableOpacity> : null}</View></View>
          <View className="gap-3"><Text className="text-lg font-bold text-foreground">Workspace drafts</Text>{isLoading ? <ActivityIndicator color={colors.primary} /> : drafts.length === 0 ? <Text className="text-sm text-muted">No workflow drafts yet. Make the plan before somebody duct-tapes it to production.</Text> : drafts.map((draft) => <View key={draft.id} className="bg-surface rounded-xl border border-border p-4 gap-2"><View className="flex-row justify-between"><Text className="font-bold text-foreground flex-1">{draft.name}</Text><Text className="text-xs uppercase text-muted">{draft.status}</Text></View>{draft.description ? <Text className="text-sm text-muted">{draft.description}</Text> : null}<Text className="text-xs text-warning">Execution intentionally unavailable.</Text><View className="flex-row gap-4"><TouchableOpacity onPress={() => editDraft(draft)} disabled={busy}><Text className="text-sm font-semibold text-primary">Edit</Text></TouchableOpacity>{draft.status === "draft" ? <TouchableOpacity onPress={() => save.mutate({ workflowId: draft.id, status: "archived" })} disabled={busy}><Text className="text-sm font-semibold text-muted">Archive</Text></TouchableOpacity> : null}<TouchableOpacity onPress={() => remove.mutate({ workflowId: draft.id })} disabled={busy}><Text className="text-sm font-semibold text-error">Delete</Text></TouchableOpacity></View></View>)}</View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
