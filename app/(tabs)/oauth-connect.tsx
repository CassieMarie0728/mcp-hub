import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const providers = ["github", "slack", "notion"] as const;

export default function OAuthConnectScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: servers = [], isLoading: loadingServers } = trpc.mcp.getAllServers.useQuery();
  const { data: connections = [], isLoading: loadingConnections } = trpc.oauth.listConnections.useQuery();
  const create = trpc.oauth.createConnectionIntent.useMutation({ onSuccess: () => utils.oauth.listConnections.invalidate() });
  const revoke = trpc.oauth.revokeConnection.useMutation({ onSuccess: () => utils.oauth.listConnections.invalidate() });
  const [serverId, setServerId] = useState<string>();
  const [provider, setProvider] = useState<(typeof providers)[number]>("github");
  const [error, setError] = useState<string | null>(null);

  const busy = create.isPending || revoke.isPending;
  const createRecord = async () => {
    if (!serverId) return;
    setError(null);
    try {
      await create.mutateAsync({ serverId, provider });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The connection record could not be created.");
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">OAUTH FOUNDATION</Text>
          <Text className="text-4xl font-bold text-background mb-2">Connection records, no bullshit</Text>
          <Text className="text-base text-background/90 leading-relaxed">This stores an owned, revocable connection record. Provider browser authorization and token exchange stay unavailable until callback verification and provider credentials are implemented.</Text>
        </View>

        <View className="px-5 py-6 gap-5">
          {error ? <View className="bg-error rounded-xl px-4 py-3"><Text className="text-sm text-background">{error}</Text></View> : null}
          <View className="bg-surface rounded-2xl border border-border p-5 gap-4">
            <Text className="text-lg font-bold text-foreground">Create a durable connection record</Text>
            <Text className="text-sm text-muted leading-relaxed">Choose one of your secured MCP servers and the provider you plan to authorize later. This does not open a browser or claim that an account is connected.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {servers.map((server) => <TouchableOpacity key={server.id} onPress={() => setServerId(server.id)} className={cn("rounded-full border px-3 py-2", serverId === server.id ? "bg-primary border-primary" : "bg-background border-border")}><Text className={cn("text-xs font-semibold", serverId === server.id ? "text-background" : "text-foreground")}>{server.name}</Text></TouchableOpacity>)}
            </ScrollView>
            {servers.length === 0 && !loadingServers ? <Text className="text-sm text-warning">Add a secured HTTPS MCP server first.</Text> : null}
            <View className="flex-row gap-2">{providers.map((item) => <TouchableOpacity key={item} onPress={() => setProvider(item)} className={cn("flex-1 rounded-lg border py-2 items-center", provider === item ? "bg-primary border-primary" : "border-border bg-background")}><Text className={cn("text-xs font-bold capitalize", provider === item ? "text-background" : "text-foreground")}>{item}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity onPress={createRecord} disabled={!serverId || busy} className={cn("rounded-lg py-3 items-center", serverId && !busy ? "bg-primary" : "bg-muted opacity-50")}><Text className="font-semibold text-background">Save connection intent</Text></TouchableOpacity>
          </View>

          <View className="gap-3"><Text className="text-lg font-bold text-foreground">Workspace connection records</Text>{loadingConnections ? <ActivityIndicator color={colors.primary} /> : connections.length === 0 ? <Text className="text-sm text-muted">No connection records yet.</Text> : connections.map((connection) => <View key={connection.id} className="bg-surface rounded-xl border border-border p-4 gap-2"><View className="flex-row justify-between"><Text className="font-bold text-foreground capitalize">{connection.provider}</Text><Text className="text-xs text-muted uppercase">{connection.status}</Text></View><Text className="text-xs text-muted">Provider authorization is still intentionally unavailable.</Text>{connection.status !== "revoked" ? <TouchableOpacity onPress={() => revoke.mutate({ connectionId: connection.id })} disabled={busy}><Text className="text-sm font-semibold text-error">Revoke record</Text></TouchableOpacity> : null}</View>)}</View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
