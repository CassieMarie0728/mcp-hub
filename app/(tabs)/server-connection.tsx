import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type AuthMode = "none" | "bearer" | "api-key" | "basic";

type ConnectionForm = {
  name: string;
  endpoint: string;
  authMode: AuthMode;
  token: string;
  username: string;
  password: string;
};

const initialForm: ConnectionForm = {
  name: "",
  endpoint: "",
  authMode: "none",
  token: "",
  username: "",
  password: "",
};

const authOptions: { value: AuthMode; label: string }[] = [
  { value: "none", label: "No auth" },
  { value: "bearer", label: "Bearer" },
  { value: "api-key", label: "API key" },
  { value: "basic", label: "Basic" },
];

function validateEndpoint(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return "Use an HTTPS endpoint. HTTP is not allowed.";
    if (url.username || url.password) return "Do not include credentials in the endpoint URL.";
    if (url.port && url.port !== "443") return "Use the standard HTTPS port.";
    return null;
  } catch {
    return "Enter a complete HTTPS URL, such as https://mcp.example.com.";
  }
}

export default function ServerConnectionScreen() {
  const colors = useColors();
  const [form, setForm] = useState<ConnectionForm>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const serversQuery = trpc.mcp.getAllServers.useQuery();
  const registerMutation = trpc.mcp.registerServer.useMutation();
  const testMutation = trpc.mcp.testConnection.useMutation();
  const removeMutation = trpc.mcp.removeServer.useMutation();

  const isSaving = registerMutation.isPending || testMutation.isPending || removeMutation.isPending;
  const servers = useMemo(() => serversQuery.data ?? [], [serversQuery.data]);

  const updateForm = useCallback(<K extends keyof ConnectionForm>(key: K, value: ConnectionForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    const name = form.name.trim();
    const endpoint = form.endpoint.trim();
    const endpointError = validateEndpoint(endpoint);
    if (!name) {
      setFormError("Name this connection so it is identifiable later.");
      return;
    }
    if (endpointError) {
      setFormError(endpointError);
      return;
    }
    if ((form.authMode === "bearer" || form.authMode === "api-key") && !form.token.trim()) {
      setFormError("Add the credential required by this authentication mode.");
      return;
    }
    if (form.authMode === "basic" && (!form.username.trim() || !form.password)) {
      setFormError("Basic authentication needs both a username and password.");
      return;
    }

    try {
      const auth = form.authMode === "none"
        ? undefined
        : form.authMode === "basic"
          ? { type: "basic" as const, username: form.username.trim(), password: form.password }
          : { type: form.authMode as "bearer" | "api-key", token: form.token.trim() };
      const registered = await registerMutation.mutateAsync({
        name,
        url: endpoint,
        type: "http",
        auth,
      });
      const connection = await testMutation.mutateAsync({ serverId: registered.serverId });
      await serversQuery.refetch();
      setForm(initialForm);
      Alert.alert(
        connection.connected ? "Server connected" : "Server saved",
        connection.connected
          ? `${name} responded to the connection check.`
          : `${name} was saved, but the connection check did not succeed. Verify the endpoint and credentials.`,
      );
    } catch {
      setFormError("That connection could not be saved. Verify the endpoint, credentials, and your sign-in state.");
    }
  }, [form, registerMutation, serversQuery, testMutation]);

  const testServer = useCallback(async (serverId: string, name: string) => {
    try {
      const result = await testMutation.mutateAsync({ serverId });
      await serversQuery.refetch();
      Alert.alert(result.connected ? "Connection healthy" : "Connection failed", result.connected
        ? `${name} responded to the connection check.`
        : `${name} did not respond. Check its availability and credentials.`);
    } catch {
      Alert.alert("Connection failed", "The check could not be completed. Try again after verifying the endpoint.");
    }
  }, [serversQuery, testMutation]);

  const removeServer = useCallback((serverId: string, name: string) => {
    Alert.alert("Remove server?", `Remove ${name} and its encrypted credentials from this workspace?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeMutation.mutateAsync({ serverId });
            await serversQuery.refetch();
          } catch {
            Alert.alert("Could not remove server", "Try again in a moment.");
          }
        },
      },
    ]);
  }, [removeMutation, serversQuery]);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={servers}
        keyExtractor={(server) => server.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View className="mb-6">
              <Text className="text-3xl font-bold text-foreground">Connect an MCP server</Text>
              <Text className="mt-2 text-base leading-6 text-muted">
                Add one HTTPS endpoint at a time. Credentials are encrypted before they are stored and never returned to this screen.
              </Text>
            </View>

            <View className="mb-7 rounded-2xl border border-border bg-surface p-4">
              <Text className="mb-4 text-lg font-semibold text-foreground">New connection</Text>
              <Field
                label="Connection name"
                value={form.name}
                onChangeText={(value) => updateForm("name", value)}
                placeholder="Production tools"
                editable={!isSaving}
              />
              <Field
                label="HTTPS endpoint"
                value={form.endpoint}
                onChangeText={(value) => updateForm("endpoint", value)}
                placeholder="https://mcp.example.com"
                autoCapitalize="none"
                keyboardType="url"
                editable={!isSaving}
              />

              <Text className="mb-2 text-sm font-semibold text-foreground">Authentication</Text>
              <View style={styles.authOptions}>
                {authOptions.map((option) => {
                  const active = form.authMode === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityLabel={`${option.label} authentication`}
                      accessibilityState={{ selected: active, disabled: isSaving }}
                      disabled={isSaving}
                      onPress={() => updateForm("authMode", option.value)}
                      style={[styles.authOption, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}18` : colors.background }]}
                    >
                      <Text style={{ color: active ? colors.primary : colors.foreground, fontWeight: "600" }}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {(form.authMode === "bearer" || form.authMode === "api-key") && (
                <Field
                  label={form.authMode === "bearer" ? "Bearer token" : "API key"}
                  value={form.token}
                  onChangeText={(value) => updateForm("token", value)}
                  placeholder="Paste credential"
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              )}
              {form.authMode === "basic" && (
                <>
                  <Field label="Username" value={form.username} onChangeText={(value) => updateForm("username", value)} placeholder="Username" autoCapitalize="none" editable={!isSaving} />
                  <Field label="Password" value={form.password} onChangeText={(value) => updateForm("password", value)} placeholder="Password" secureTextEntry editable={!isSaving} />
                </>
              )}

              {formError && <Text accessibilityLiveRegion="polite" className="mb-3 text-sm text-error">{formError}</Text>}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save and test MCP server connection"
                accessibilityState={{ disabled: isSaving, busy: isSaving }}
                disabled={isSaving}
                onPress={submit}
                style={[styles.primaryButton, { backgroundColor: isSaving ? `${colors.primary}88` : colors.primary }]}
              >
                {isSaving ? <ActivityIndicator color={colors.background} /> : <Text style={{ color: colors.background, fontWeight: "700" }}>Save and test connection</Text>}
              </Pressable>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">Your servers</Text>
              {serversQuery.isFetching && <ActivityIndicator color={colors.primary} size="small" />}
            </View>
            {serversQuery.isError && <Text className="mb-3 text-sm text-error">Your server list could not be loaded. Sign in and try again.</Text>}
          </View>
        }
        ListEmptyComponent={serversQuery.isLoading ? <ActivityIndicator color={colors.primary} style={styles.empty} /> : (
          <View className="rounded-2xl border border-dashed border-border bg-surface p-5">
            <Text className="font-semibold text-foreground">No server connections yet.</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Add an HTTPS endpoint above. No fake green lights, no local-only ghost connections.</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const statusColor = item.status === "connected" ? colors.success : item.status === "error" ? colors.error : colors.muted;
          return (
            <View className="mb-3 rounded-2xl border border-border bg-surface p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View style={styles.serverTitle}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} accessibilityLabel={`Status: ${item.status}`} />
                  <View style={styles.serverCopy}>
                    <Text className="font-semibold text-foreground">{item.name}</Text>
                    <Text className="mt-1 text-xs text-muted" numberOfLines={1}>{item.url}</Text>
                  </View>
                </View>
                <Text style={{ color: statusColor, fontSize: 12, fontWeight: "700", textTransform: "capitalize" }}>{item.status}</Text>
              </View>
              {item.lastError && <Text className="mt-3 text-sm text-error">{item.lastError}</Text>}
              <View style={styles.serverActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Test ${item.name} connection`}
                  accessibilityState={{ disabled: isSaving, busy: testMutation.isPending }}
                  disabled={isSaving}
                  onPress={() => testServer(item.id, item.name)}
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Test</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.name}`}
                  accessibilityState={{ disabled: isSaving }}
                  disabled={isSaving}
                  onPress={() => removeServer(item.id, item.name)}
                  style={[styles.secondaryButton, { borderColor: colors.error }]}
                >
                  <Text style={{ color: colors.error, fontWeight: "700" }}>Remove</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "url";
  editable: boolean;
}) {
  const colors = useColors();
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        returnKeyType="done"
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 112 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  authOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  authOption: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  primaryButton: { alignItems: "center", borderRadius: 12, justifyContent: "center", minHeight: 50, paddingHorizontal: 16 },
  secondaryButton: { alignItems: "center", borderWidth: 1, borderRadius: 10, flex: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: 12 },
  empty: { marginVertical: 28 },
  serverTitle: { alignItems: "flex-start", flex: 1, flexDirection: "row", minWidth: 0 },
  serverCopy: { flex: 1, minWidth: 0 },
  statusDot: { borderRadius: 5, height: 10, marginRight: 10, marginTop: 5, width: 10 },
  serverActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
