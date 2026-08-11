import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIAssistantContext {
  currentScreen?: string;
  workflowData?: Record<string, unknown>;
  recentActions?: string[];
}

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  context?: AIAssistantContext;
}

export function AIChatModal({ visible, onClose, context }: AIChatModalProps) {
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initial greeting
  useEffect(() => {
    if (visible && messages.length === 0) {
      const greeting: Message = {
        id: "greeting",
        role: "assistant",
        content: "Hi! I'm your MCP Hub AI Assistant. I can help you with workflows, MCP connections, troubleshooting, and anything else about the app. What can I help you with?",
        timestamp: Date.now(),
      };
      setMessages([greeting]);
    }
  }, [visible, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API
      const response = await fetch("http://localhost:3000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.role !== "assistant" || m.id !== "greeting")
            .map((m) => ({
              role: m.role,
              content: m.content,
            }))
            .concat([{ role: "user", content: input }]),
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMsg);
      console.error("[ai-chat] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 }}
        >
          <Text className="text-lg font-semibold text-foreground">AI Assistant</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-lg text-muted">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={cn(
                "mb-3 max-w-xs rounded-lg px-3 py-2",
                msg.role === "user"
                  ? "self-end bg-primary"
                  : "self-start bg-surface border border-border"
              )}
            >
              <Text
                className={cn(
                  "text-sm leading-5",
                  msg.role === "user" ? "text-background" : "text-foreground"
                )}
              >
                {msg.content}
              </Text>
              <Text
                className={cn(
                  "text-xs mt-1",
                  msg.role === "user" ? "text-background opacity-70" : "text-muted"
                )}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View className="self-start mb-3">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {error && (
            <View className="self-start mb-3 bg-error rounded-lg px-3 py-2 max-w-xs">
              <Text className="text-sm text-background">{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View
          className="flex-row items-center gap-2 px-4 py-3 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            editable={!isLoading}
            className="flex-1 bg-surface text-foreground rounded-lg px-3 py-2 border border-border"
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className={cn(
              "p-2 rounded-lg",
              input.trim() && !isLoading ? "bg-primary" : "bg-muted opacity-50"
            )}
          >
            <Text className="text-lg">→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
