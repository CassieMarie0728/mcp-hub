import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import { Input } from "@/components/ui/input";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cancelProviderResetAlert, scheduleProviderResetAlert } from "@/lib/provider-reset-alerts";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ProviderId = "openrouter" | "gemini" | "groq" | "mistral";
type Health = {
  provider: ProviderId;
  status: "valid" | "invalid" | "rate_limited" | "unavailable";
  remainingRequests: number | null;
  remainingTokens: number | null;
  remainingCredit: string | null;
  resetAt: Date | null;
};

const PROVIDERS: Record<ProviderId, { label: string; models: readonly string[]; priceTruth: string; usageTruth: string }> = {
  openrouter: { label: "OpenRouter", models: ["meta-llama/llama-3.3-70b-instruct:free"], priceTruth: "MCP Hub accepts only a model that explicitly ends in :free. No paid fallback—period.", usageTruth: "Provider key credits appear only when OpenRouter returns them." },
  gemini: { label: "Gemini", models: ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"], priceTruth: "Only allowlisted free-tier models are accepted. Google limits usage per project and can change those limits.", usageTruth: "Google does not expose a safe remaining-quota number here; check AI Studio for project limits." },
  groq: { label: "Groq", models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"], priceTruth: "Use Groq’s free plan. Limits belong to your Groq organization, not a fake unlimited buffet.", usageTruth: "Requests/tokens appear only when Groq returns documented rate-limit headers." },
  mistral: { label: "Mistral", models: ["mistral-small-latest", "mistral-nemo"], priceTruth: "Your Mistral account controls its own allowance and billing. We won’t lie and call it permanently free.", usageTruth: "Mistral account/workspace usage stays in its provider dashboard; no fake remaining number is shown." },
};

function messageFrom(error: unknown) {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "That provider action failed. The key goblins remain suspicious—try again.";
}

function healthLabel(health: Health | undefined, provider: ProviderId) {
  if (!health) return "Not tested yet.";
  if (health.status === "valid") return "Key verified.";
  if (health.status === "rate_limited") return `${PROVIDERS[provider].label} is rate limited.${health.resetAt ? ` Reset: ${new Date(health.resetAt).toLocaleString()}.` : " No trustworthy reset time returned."}`;
  if (health.status === "invalid") return "The provider rejected this key.";
  return "Provider test is unavailable right now.";
}

export default function AssistantProvidersScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: configurations = [], isLoading } = trpc.assistant.listProviderConfigurations.useQuery();
  const { data: healthRows = [] } = trpc.assistant.listProviderHealth.useQuery();
  const { data: preferences = [] } = trpc.assistant.listProviderAlertPreferences.useQuery();
  const save = trpc.assistant.saveProviderConfiguration.useMutation({ onSuccess: () => { utils.assistant.listProviderConfigurations.invalidate(); utils.assistant.listProviderHealth.invalidate(); } });
  const remove = trpc.assistant.removeProviderConfiguration.useMutation({ onSuccess: () => { utils.assistant.listProviderConfigurations.invalidate(); utils.assistant.listProviderHealth.invalidate(); } });
  const testKey = trpc.assistant.testProviderKey.useMutation({ onSuccess: () => utils.assistant.listProviderHealth.invalidate() });
  const setAlert = trpc.assistant.setProviderResetAlert.useMutation({ onSuccess: () => utils.assistant.listProviderAlertPreferences.invalidate() });
  const setFallback = trpc.assistant.setProviderFallback.useMutation({ onSuccess: () => utils.assistant.listProviderConfigurations.invalidate() });

  const [selected, setSelected] = useState<ProviderId>("openrouter");
  const [model, setModel] = useState(PROVIDERS.openrouter.models[0]);
  const [apiKey, setApiKey] = useState("");
  const [fallbackPriority, setFallbackPriority] = useState("100");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedConfig = configurations.find((config) => config.provider === selected);
  const healthByProvider = new Map(healthRows.map((health) => [health.provider as ProviderId, health as Health]));
  const preferenceByProvider = new Map(preferences.map((preference) => [preference.provider as ProviderId, preference.resetAlertEnabled]));
  const busy = save.isPending || remove.isPending || testKey.isPending || setAlert.isPending || setFallback.isPending;
  const parsedPriority = Number(fallbackPriority);
  const autoFallbackEligible = selected !== "mistral";

  useEffect(() => {
    setModel(PROVIDERS[selected].models[0]);
    setApiKey("");
    setFallbackPriority(String(selectedConfig?.fallbackPriority ?? 100));
    setError(null);
    setNotice(null);
  }, [selected, selectedConfig?.fallbackPriority]);

  const saveKey = async () => {
    setError(null);
    try {
      await save.mutateAsync({ provider: selected, model, apiKey });
      setApiKey("");
      setNotice(`${PROVIDERS[selected].label} key encrypted and saved. Test it before trusting it.`);
    } catch (reason) { setError(messageFrom(reason)); }
  };

  const runKeyTest = async (provider: ProviderId) => {
    setError(null); setNotice(null);
    try {
      const result = await testKey.mutateAsync({ provider });
      setNotice(result.message);
      if (preferenceByProvider.get(provider) && result.health.status === "rate_limited" && result.health.resetAt) {
        const scheduled = await scheduleProviderResetAlert(provider, new Date(result.health.resetAt));
        setNotice(`${result.message} ${scheduled.message}`);
      }
    } catch (reason) { setError(messageFrom(reason)); }
  };

  const toggleAlert = async (provider: ProviderId, enabled: boolean) => {
    setError(null); setNotice(null);
    try {
      await setAlert.mutateAsync({ provider, enabled });
      if (!enabled) {
        await cancelProviderResetAlert(provider);
        setNotice(`${PROVIDERS[provider].label} reset alerts are off on this device.`);
        return;
      }
      const health = healthByProvider.get(provider);
      if (health?.status === "rate_limited" && health.resetAt) {
        const scheduled = await scheduleProviderResetAlert(provider, new Date(health.resetAt));
        setNotice(scheduled.message);
      } else {
        setNotice("Reset alerts are on. MCP Hub schedules one only after a real reset time comes back—no tarot-card quota predictions.");
      }
    } catch (reason) { setError(messageFrom(reason)); }
  };

  const toggleFallback = async (enabled: boolean) => {
    if (!selectedConfig || !Number.isInteger(parsedPriority) || parsedPriority < 1 || parsedPriority > 100) {
      setError("Fallback order must be a whole number from 1 to 100. Math remains a cruel but fair mistress.");
      return;
    }
    setError(null); setNotice(null);
    try {
      await setFallback.mutateAsync({ provider: selected, enabled, priority: parsedPriority });
      setNotice(enabled
        ? `${PROVIDERS[selected].label} is now an opt-in fallback at order ${parsedPriority}. It runs only after the selected provider returns a rate limit.`
        : `${PROVIDERS[selected].label} will not be used as an automatic fallback.`);
    } catch (reason) { setError(messageFrom(reason)); }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">ASSISTANT KEYS & LIMITS</Text>
          <Text className="text-3xl font-bold text-background mb-2">Your keys. Your limits. Your damn choice.</Text>
          <Text className="text-sm text-background/90 leading-relaxed">Keys stay encrypted and never reappear here. Automatic fallback is opt-in, uses only your configured providers, and never routes to a paid surprise.</Text>
        </View>
        <View className="px-5 py-6 gap-5">
          {error ? <View className="bg-error rounded-xl px-4 py-3"><Text className="text-sm text-background">{error}</Text></View> : null}
          {notice ? <View className="bg-primary/15 border border-primary/30 rounded-xl px-4 py-3"><Text className="text-sm text-foreground">{notice}</Text></View> : null}

          <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
            <Text className="text-base font-bold text-foreground">Choose a provider</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(Object.keys(PROVIDERS) as ProviderId[]).map((provider) => (
                <TouchableOpacity key={provider} onPress={() => setSelected(provider)} disabled={busy} className={cn("rounded-full border px-3 py-2", selected === provider ? "bg-primary border-primary" : "bg-background border-border")}>
                  <Text className={cn("text-xs font-bold", selected === provider ? "text-background" : "text-foreground")}>{PROVIDERS[provider].label}{configurations.some((config) => config.provider === provider) ? " ✓" : ""}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text className="text-xs text-muted leading-relaxed">{PROVIDERS[selected].priceTruth}</Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl p-4 gap-4">
            <View>
              <Text className="text-base font-bold text-foreground">{selectedConfig ? `Replace ${PROVIDERS[selected].label} key` : `Add ${PROVIDERS[selected].label} key`}</Text>
              <Text className="text-xs text-muted mt-1">Status: {selectedConfig ? `configured · ${selectedConfig.model}` : "not configured"}</Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Allowed model</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PROVIDERS[selected].models.map((option) => <TouchableOpacity key={option} onPress={() => setModel(option)} disabled={busy} className={cn("rounded-lg border px-3 py-2", model === option ? "bg-primary border-primary" : "bg-background border-border")}><Text className={cn("text-xs", model === option ? "text-background" : "text-foreground")}>{option}</Text></TouchableOpacity>)}
              </ScrollView>
            </View>
            <Input variant="password" label={`${PROVIDERS[selected].label} API key`} placeholder="Paste a new key" value={apiKey} onChangeText={setApiKey} disabled={busy} />
            <TouchableOpacity onPress={saveKey} disabled={busy || apiKey.trim().length < 8} className={cn("rounded-lg py-3 items-center", !busy && apiKey.trim().length >= 8 ? "bg-primary" : "bg-muted opacity-50")}><Text className="font-semibold text-background">Save encrypted key</Text></TouchableOpacity>

            {selectedConfig ? <View className="gap-3">
              <TouchableOpacity onPress={() => runKeyTest(selected)} disabled={busy} className="rounded-lg py-3 items-center border border-primary"><Text className="font-semibold text-primary">{testKey.isPending ? "Testing key…" : "Test Key & Refresh Limits"}</Text></TouchableOpacity>
              <Text className="text-xs text-muted">{healthLabel(healthByProvider.get(selected), selected)}</Text>
              <Text className="text-xs text-muted">{PROVIDERS[selected].usageTruth}</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3"><Text className="text-sm font-semibold text-foreground">Notify me when it resets</Text><Text className="text-xs text-muted mt-1">Only scheduled if a rate-limited response gives us a real reset time.</Text></View>
                <Switch value={Boolean(preferenceByProvider.get(selected))} onValueChange={(enabled) => toggleAlert(selected, enabled)} disabled={busy} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} />
              </View>
              <View className="border-t border-border pt-3 gap-2">
                <Text className="text-sm font-semibold text-foreground">Use as automatic fallback</Text>
                <Text className="text-xs text-muted">Only used after another provider returns a rate limit. MCP Hub announces the switch and never reaches for a paid model. {autoFallbackEligible ? "" : "Mistral stays manual because its billing cannot be guaranteed free."}</Text>
                <Input label="Fallback order (1 = first)" value={fallbackPriority} onChangeText={setFallbackPriority} disabled={busy} />
                <View className="flex-row items-center justify-between"><Text className="text-xs text-muted">Enabled providers are tried in ascending order.</Text><Switch value={selectedConfig.fallbackEnabled} onValueChange={toggleFallback} disabled={busy || !autoFallbackEligible} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.background} /></View>
              </View>
              <TouchableOpacity onPress={() => remove.mutate({ provider: selected })} disabled={busy} className="items-center py-2"><Text className="text-sm font-semibold text-error">Remove this provider key</Text></TouchableOpacity>
            </View> : null}
          </View>

          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4"><Text className="text-sm font-bold text-foreground mb-1">No fictional quota meter or silent provider swap</Text><Text className="text-sm text-muted leading-relaxed">Gemini and Mistral can verify a key without returning safe remaining usage. Fallback happens only after an actual rate-limit response, only with your enabled providers, and any tool action still needs your separate approval.</Text></View>

          <View className="gap-3">
            <Text className="text-base font-bold text-foreground">Configured providers</Text>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : configurations.length === 0 ? <Text className="text-sm text-muted">No provider keys configured yet.</Text> : configurations.map((configuration) => {
              const provider = configuration.provider as ProviderId; const health = healthByProvider.get(provider);
              return <View key={provider} className="bg-surface border border-border rounded-xl p-4 gap-2"><View className="flex-row justify-between"><Text className="font-semibold text-foreground">{PROVIDERS[provider].label}</Text><Text className="text-xs text-muted uppercase">{health?.status ?? "untested"}</Text></View><Text className="text-xs text-muted">{configuration.model} · encrypted key configured</Text><Text className="text-xs text-muted">Fallback: {configuration.fallbackEnabled ? `enabled · order ${configuration.fallbackPriority}` : "off"}</Text>{health?.remainingCredit ? <Text className="text-xs text-foreground">Remaining credit: {health.remainingCredit}</Text> : null}{health?.remainingRequests !== null && health?.remainingRequests !== undefined ? <Text className="text-xs text-foreground">Remaining requests: {health.remainingRequests}</Text> : null}{health?.remainingTokens !== null && health?.remainingTokens !== undefined ? <Text className="text-xs text-foreground">Remaining tokens: {health.remainingTokens}</Text> : null}<TouchableOpacity onPress={() => runKeyTest(provider)} disabled={busy} className="self-start"><Text className="text-sm font-semibold text-primary">Test Key</Text></TouchableOpacity></View>;
            })}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
