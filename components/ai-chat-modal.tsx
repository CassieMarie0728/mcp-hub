import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type AssistantContext = {
  currentScreen?: string;
  workflowData?: Record<string, unknown>;
  recentActions?: string[];
};

type ToolProposal = {
  id: string;
  serverId: string;
  serverName?: string;
  toolName: string;
  input: Record<string, unknown>;
  expiresAt: Date;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  proposal?: ToolProposal | null;
};

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  context?: AssistantContext;
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

export function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { data: providerConfig, isLoading: loadingProvider } = trpc.assistant.getProviderConfiguration.useQuery(undefined, {
    enabled: visible,
  });
  const { data: servers = [] } = trpc.mcp.getAllServers.useQuery(undefined, { enabled: visible && Boolean(providerConfig) });
  const saveProvider = trpc.assistant.saveProviderConfiguration.useMutation({
    onSuccess: () => utils.assistant.getProviderConfiguration.invalidate(),
  });
  const removeProvider = trpc.assistant.removeProviderConfiguration.useMutation({
    onSuccess: () => utils.assistant.getProviderConfiguration.invalidate(),
  });
  const converse = trpc.assistant.converse.useMutation();
  const decideProposal = trpc.assistant.decideToolProposal.useMutation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("meta-llama/llama-3.3-70b-instruct:free");
  const [selectedServerId, setSelectedServerId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      setMessages([{ id: "greeting", role: "assistant", content: "I can explain your MCP workspace and prepare a tool action for your approval. I do not execute anything until you say yes.", timestamp: Date.now() }]);
    }
  }, [visible, messages.length]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const selectedServer = servers.find((server) => server.id === selectedServerId);
  const loading = saveProvider.isPending || removeProvider.isPending || converse.isPending || decideProposal.isPending;

  const handleSaveProvider = async () => {
    setError(null);
    try {
      await saveProvider.mutateAsync({ provider: "openrouter", model, apiKey });
      setApiKey("");
    } catch (reason) {
      setError(errorMessage(reason, "Your provider configuration could not be saved."));
    }
  };

  const handleSendMessage = async () => {
    const content = input.trim();
    if (!content || !providerConfig) return;
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content, timestamp: Date.now() };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    try {
      const history = [...messages, userMessage]
        .filter((message) => message.id !== "greeting")
        .map(({ role, content: messageContent }) => ({ role, content: messageContent }));
      const response = await converse.mutateAsync({ messages: history, serverId: selectedServerId });
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.response,
          timestamp: Date.now(),
          proposal: response.proposal,
        },
      ]);
    } catch (reason) {
      setError(errorMessage(reason, "The assistant could not respond. Check your configured provider and try again."));
    }
  };

  const handleProposalDecision = async (proposal: ToolProposal, approved: boolean) => {
    setError(null);
    try {
      const result = await decideProposal.mutateAsync({ proposalId: proposal.id, approved });
      setMessages((current) => current.map((message) => message.proposal?.id === proposal.id
        ? { ...message, proposal: null, content: `${message.content}\n\n${result.message}.` }
        : message));
    } catch (reason) {
      setError(errorMessage(reason, "That approval could not be completed. No additional tool action was started."));
    }
  };

  const renderProviderSetup = () => (
    <ScrollView className="flex-1 px-5 py-6" contentContainerStyle={{ gap: 16 }}>
      <Text className="text-2xl font-bold text-foreground">Connect your own assistant provider</Text>
      <Text className="text-sm text-muted leading-relaxed">
        MCP Hub stores your key encrypted on the server and never returns it to the phone. Choose an explicitly free OpenRouter model identifier ending in <Text className="font-bold">:free</Text>. Nothing is selected behind your back.
      </Text>
      <View className="bg-surface border border-border rounded-2xl p-4 gap-3">
        <Text className="text-sm font-semibold text-foreground">OpenRouter model</Text>
        <TextInput value={model} onChangeText={setModel} editable={!loading} autoCapitalize="none" autoCorrect={false} className="bg-background text-foreground rounded-lg border border-border px-3 py-3" />
        <Text className="text-xs text-muted">Use a model identifier that explicitly ends with :free.</Text>
        <Text className="text-sm font-semibold text-foreground mt-2">Your provider key</Text>
        <TextInput value={apiKey} onChangeText={setApiKey} secureTextEntry editable={!loading} autoCapitalize="none" autoCorrect={false} placeholder="Paste your key" placeholderTextColor={colors.muted} className="bg-background text-foreground rounded-lg border border-border px-3 py-3" />
        <TouchableOpacity onPress={handleSaveProvider} disabled={loading || apiKey.trim().length < 8} className={cn("rounded-lg px-4 py-3 items-center", apiKey.trim().length >= 8 && !loading ? "bg-primary" : "bg-muted opacity-50")}>
          <Text className="font-semibold text-background">Save encrypted configuration</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderChat = () => (
    <>
      <View className="px-4 py-3 border-b border-border gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted">Using your selected model: <Text className="font-semibold text-foreground">{providerConfig?.model}</Text></Text>
          <TouchableOpacity onPress={() => removeProvider.mutate()} disabled={loading}>
            <Text className="text-sm text-error font-semibold">Remove key</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity onPress={() => setSelectedServerId(undefined)} className={cn("px-3 py-2 rounded-full border", !selectedServerId ? "bg-primary border-primary" : "border-border bg-surface")}>
            <Text className={cn("text-xs font-semibold", !selectedServerId ? "text-background" : "text-foreground")}>Conversation only</Text>
          </TouchableOpacity>
          {servers.map((server) => (
            <TouchableOpacity key={server.id} onPress={() => setSelectedServerId(server.id)} className={cn("px-3 py-2 rounded-full border", selectedServerId === server.id ? "bg-primary border-primary" : "border-border bg-surface")}>
              <Text className={cn("text-xs font-semibold", selectedServerId === server.id ? "text-background" : "text-foreground")}>{server.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text className="text-xs text-muted">{selectedServer ? `Tool proposals are limited to ${selectedServer.name}.` : "Select a connected server only when you want the assistant to propose a tool action."}</Text>
      </View>
      <ScrollView ref={scrollViewRef} className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((message) => (
          <View key={message.id} className={cn("mb-3 max-w-[88%] rounded-xl px-3 py-3", message.role === "user" ? "self-end bg-primary" : "self-start bg-surface border border-border")}>
            <Text className={cn("text-sm leading-5", message.role === "user" ? "text-background" : "text-foreground")}>{message.content}</Text>
            {message.proposal ? (
              <View className="mt-3 border-t border-border pt-3 gap-2">
                <Text className="text-xs font-bold text-foreground">APPROVAL REQUIRED</Text>
                <Text className="text-xs text-muted">{message.proposal.serverName ?? "Selected server"} · {message.proposal.toolName}</Text>
                <Text className="text-xs text-muted" numberOfLines={4}>{JSON.stringify(message.proposal.input)}</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => handleProposalDecision(message.proposal!, false)} disabled={loading} className="flex-1 border border-border rounded-lg py-2 items-center"><Text className="text-sm font-semibold text-foreground">Decline</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleProposalDecision(message.proposal!, true)} disabled={loading} className="flex-1 bg-primary rounded-lg py-2 items-center"><Text className="text-sm font-semibold text-background">Approve</Text></TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        ))}
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </ScrollView>
      <View className="flex-row items-end gap-2 px-4 py-3 border-t border-border">
        <TextInput value={input} onChangeText={setInput} placeholder="Ask about your workspace…" placeholderTextColor={colors.muted} multiline maxLength={8_000} editable={!loading} className="flex-1 bg-surface text-foreground rounded-lg px-3 py-2 border border-border" style={{ maxHeight: 108 }} />
        <TouchableOpacity onPress={handleSendMessage} disabled={!input.trim() || loading} className={cn("rounded-lg p-3", input.trim() && !loading ? "bg-primary" : "bg-muted opacity-50")}><Text className="text-background font-bold">Send</Text></TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-row items-center justify-between px-4 py-3 bg-surface border-b border-border">
          <View><Text className="text-lg font-semibold text-foreground">Your MCP Assistant</Text><Text className="text-xs text-muted">Nothing runs until you approve it.</Text></View>
          <TouchableOpacity onPress={onClose} className="p-2"><Text className="text-lg text-muted">✕</Text></TouchableOpacity>
        </View>
        {error ? <View className="mx-4 mt-3 bg-error rounded-lg px-3 py-2"><Text className="text-sm text-background">{error}</Text></View> : null}
        {loadingProvider ? <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.primary} /></View> : providerConfig ? renderChat() : renderProviderSetup()}
      </KeyboardAvoidingView>
    </Modal>
  );
}
