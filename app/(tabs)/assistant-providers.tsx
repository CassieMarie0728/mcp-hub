import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { Input } from "@/components/ui/input";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type ProviderId = "openrouter" | "gemini" | "groq" | "mistral";

const PROVIDERS: Record<ProviderId, { label: string; models: readonly string[]; priceTruth: string }> = {
  openrouter: { label: "OpenRouter", models: ["meta-llama/llama-3.3-70b-instruct:free"], priceTruth: "MCP Hub accepts only a model that explicitly ends in :free. No paid fallback—period." },
  gemini: { label: "Gemini", models: ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"], priceTruth: "Only allowlisted free-tier models are accepted. Google limits usage per project and can change those limits." },
  groq: { label: "Groq", models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"], priceTruth: "Use Groq’s free plan. Limits belong to your Groq organization, not a fake unlimited buffet." },
  mistral: { label: "Mistral", models: ["mistral-small-latest", "mistral-nemo"], priceTruth: "Your Mistral account controls its own allowance and billing. We won’t lie and call it permanently free." },
};

function messageFrom(error: unknown) {
  return error && typeof error === "object" && "message" in error && typeof error.message === "string"
    ? error.message
    : "That key could not be saved. The encryption gremlins are not impressed—try again.";
}

export default function AssistantProvidersScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: configurations = [], isLoading } = trpc.assistant.listProviderConfigurations.useQuery();
  const save = trpc.assistant.saveProviderConfiguration.useMutation({ onSuccess: () => utils.assistant.listProviderConfigurations.invalidate() });
  const remove = trpc.assistant.removeProviderConfiguration.useMutation({ onSuccess: () => utils.assistant.listProviderConfigurations.invalidate() });
  const [selected, setSelected] = useState<ProviderId>("openrouter");
  const [model, setModel] = useState(PROVIDERS.openrouter.models[0]);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const busy = save.isPending || remove.isPending;
  const selectedConfig = configurations.find((config) => config.provider === selected);

  useEffect(() => { setModel(PROVIDERS[selected].models[0]); setApiKey(""); setError(null); }, [selected]);

  const saveKey = async () => {
    setError(null);
    try {
      await save.mutateAsync({ provider: selected, model, apiKey });
      setApiKey("");
    } catch (reason) { setError(messageFrom(reason)); }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">ASSISTANT KEYS</Text>
          <Text className="text-3xl font-bold text-background mb-2">Your keys. Your limits. Your damn choice.</Text>
          <Text className="text-sm text-background/90 leading-relaxed">Each provider key is encrypted in your workspace and never returned to this screen. Replacing a key overwrites the encrypted record; removing it deletes that provider configuration.</Text>
        </View>
        <View className="px-5 py-6 gap-5">
          {error ? <View className="bg-error rounded-xl px-4 py-3"><Text className="text-sm text-background">{error}</Text></View> : null}
          <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
            <Text className="text-base font-bold text-foreground">Choose a provider</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(Object.keys(PROVIDERS) as ProviderId[]).map((provider) => <TouchableOpacity key={provider} onPress={() => setSelected(provider)} disabled={busy} className={cn("rounded-full border px-3 py-2", selected === provider ? "bg-primary border-primary" : "bg-background border-border")}><Text className={cn("text-xs font-bold", selected === provider ? "text-background" : "text-foreground")}>{PROVIDERS[provider].label}{configurations.some((config) => config.provider === provider) ? " ✓" : ""}</Text></TouchableOpacity>)}
            </ScrollView>
            <Text className="text-xs text-muted leading-relaxed">{PROVIDERS[selected].priceTruth}</Text>
          </View>
          <View className="bg-surface border border-border rounded-2xl p-4 gap-4">
            <View><Text className="text-base font-bold text-foreground">{selectedConfig ? `Replace ${PROVIDERS[selected].label} key` : `Add ${PROVIDERS[selected].label} key`}</Text><Text className="text-xs text-muted mt-1">Status: {selectedConfig ? `configured · ${selectedConfig.model}` : "not configured"}</Text></View>
            <View className="gap-2"><Text className="text-sm font-semibold text-foreground">Allowed model</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{PROVIDERS[selected].models.map((option) => <TouchableOpacity key={option} onPress={() => setModel(option)} disabled={busy} className={cn("rounded-lg border px-3 py-2", model === option ? "bg-primary border-primary" : "bg-background border-border")}><Text className={cn("text-xs", model === option ? "text-background" : "text-foreground")}>{option}</Text></TouchableOpacity>)}</ScrollView></View>
            <Input variant="password" label={`${PROVIDERS[selected].label} API key`} placeholder="Paste a new key" value={apiKey} onChangeText={setApiKey} disabled={busy} />
            <TouchableOpacity onPress={saveKey} disabled={busy || apiKey.trim().length < 8} className={cn("rounded-lg py-3 items-center", !busy && apiKey.trim().length >= 8 ? "bg-primary" : "bg-muted opacity-50")}><Text className="font-semibold text-background">Save encrypted key</Text></TouchableOpacity>
            {selectedConfig ? <TouchableOpacity onPress={() => remove.mutate({ provider: selected })} disabled={busy} className="items-center py-2"><Text className="text-sm font-semibold text-error">Remove this provider key</Text></TouchableOpacity> : null}
          </View>
          <View className="rounded-xl border border-warning/30 bg-warning/10 p-4"><Text className="text-sm font-bold text-foreground mb-1">When a free tier taps out</Text><Text className="text-sm text-muted leading-relaxed">MCP Hub tells you which provider hit its limit, includes a retry window when the provider gives one, and does not quietly jump to a paid model like a shady carnival barker.</Text></View>
          <View className="gap-3"><Text className="text-base font-bold text-foreground">Configured providers</Text>{isLoading ? <ActivityIndicator color={colors.primary} /> : configurations.length === 0 ? <Text className="text-sm text-muted">No provider keys configured yet.</Text> : configurations.map((configuration) => <View key={configuration.provider} className="bg-surface border border-border rounded-xl p-4"><Text className="font-semibold text-foreground">{PROVIDERS[configuration.provider as ProviderId].label}</Text><Text className="text-xs text-muted mt-1">{configuration.model} · encrypted key configured</Text></View>)}</View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
