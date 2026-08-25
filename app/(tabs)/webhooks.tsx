import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export default function WebhooksScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: webhooks = [], isLoading } = trpc.webhooks.listWebhooks.useQuery();
  const create = trpc.webhooks.createWebhook.useMutation({ onSuccess: () => utils.webhooks.listWebhooks.invalidate() });
  const remove = trpc.webhooks.deleteWebhook.useMutation({ onSuccess: () => utils.webhooks.listWebhooks.invalidate() });
  const rotate = trpc.webhooks.rotateSecret.useMutation();
  const [name, setName] = useState("");
  const [events, setEvents] = useState("mcp.execution.completed");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = create.isPending || remove.isPending || rotate.isPending;

  const createSubscription = async () => {
    const eventList = events.split(",").map((event) => event.trim()).filter(Boolean);
    if (!name.trim() || eventList.length === 0) return;
    setError(null);
    setRevealedSecret(null);
    try {
      const result = await create.mutateAsync({ name: name.trim(), events: eventList, retryPolicy: { maxRetries: 3, backoffMs: 1_000 } });
      setRevealedSecret(result.signingSecret);
      setName("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The webhook subscription could not be saved.");
    }
  };

  const rotateSecret = async (webhookId: string) => {
    setError(null);
    try {
      const result = await rotate.mutateAsync({ webhookId });
      setRevealedSecret(result.signingSecret);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The signing secret could not be rotated.");
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-primary px-6 py-8"><Text className="text-xs text-background/70 font-bold tracking-widest mb-2">WEBHOOK FOUNDATION</Text><Text className="text-4xl font-bold text-background mb-2">Store it first. Deliver it later.</Text><Text className="text-base text-background/90 leading-relaxed">Subscriptions and encrypted signing secrets now persist inside your workspace. Inbound delivery, endpoint exposure, retries, and event history remain deliberately unavailable until there is a signed receiver and durable queue.</Text></View>
        <View className="px-5 py-6 gap-5">
          {error ? <View className="bg-error rounded-xl px-4 py-3"><Text className="text-sm text-background">{error}</Text></View> : null}
          {revealedSecret ? <View className="bg-warning/15 border border-warning/40 rounded-xl p-4 gap-2"><Text className="font-bold text-foreground">Save this signing secret now</Text><Text selectable className="text-xs text-foreground">{revealedSecret}</Text><Text className="text-xs text-muted">For security, it is shown only after creating or rotating the subscription.</Text><TouchableOpacity onPress={() => setRevealedSecret(null)}><Text className="text-sm font-semibold text-primary">I saved it</Text></TouchableOpacity></View> : null}
          <View className="bg-surface rounded-2xl border border-border p-5 gap-3"><Text className="text-lg font-bold text-foreground">Create subscription configuration</Text><TextInput value={name} onChangeText={setName} placeholder="Subscription name" placeholderTextColor={colors.muted} editable={!busy} className="bg-background text-foreground rounded-lg border border-border px-3 py-3" /><TextInput value={events} onChangeText={setEvents} placeholder="Events, comma separated" placeholderTextColor={colors.muted} editable={!busy} className="bg-background text-foreground rounded-lg border border-border px-3 py-3" /><Text className="text-xs text-muted">Default retry policy: 3 retries with 1-second backoff. Delivery is not active yet.</Text><TouchableOpacity onPress={createSubscription} disabled={!name.trim() || !events.trim() || busy} className={cn("rounded-lg py-3 items-center", name.trim() && events.trim() && !busy ? "bg-primary" : "bg-muted opacity-50")}><Text className="font-semibold text-background">Save subscription</Text></TouchableOpacity></View>
          <View className="gap-3"><Text className="text-lg font-bold text-foreground">Workspace subscriptions</Text>{isLoading ? <ActivityIndicator color={colors.primary} /> : webhooks.length === 0 ? <Text className="text-sm text-muted">No webhook subscriptions configured.</Text> : webhooks.map((webhook) => <View key={webhook.id} className="bg-surface rounded-xl border border-border p-4 gap-2"><View className="flex-row justify-between"><Text className="font-bold text-foreground">{webhook.name}</Text><Text className="text-xs uppercase text-muted">{webhook.status}</Text></View><Text className="text-xs text-muted">Events: {webhook.events.join(", ")}</Text><Text className="text-xs text-warning">Delivery is intentionally unavailable.</Text><View className="flex-row gap-4"><TouchableOpacity onPress={() => rotateSecret(webhook.id)} disabled={busy}><Text className="text-sm font-semibold text-primary">Rotate secret</Text></TouchableOpacity><TouchableOpacity onPress={() => remove.mutate({ webhookId: webhook.id })} disabled={busy}><Text className="text-sm font-semibold text-error">Delete</Text></TouchableOpacity></View></View>)}</View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
