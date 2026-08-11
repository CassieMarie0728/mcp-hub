import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useMCPService } from '@/hooks/use-mcp-service';
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { MCPTool } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolName?: string;
  serverId?: string;
  timestamp: number;
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const { servers, tools: allTools, settings, addExecutionResult } = useApp();
  const { executeTool } = useMCPService();
  const colors = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'MCP Chat',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
      },
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerLeft: () => (
        <View style={{ marginLeft: 16 }}>
          <MaterialIcons name="chat-bubble" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const connectedServers = servers.filter((s) => s.status === 'connected');
  const serverTools = selectedServerId ? allTools[selectedServerId] || [] : [];

  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServerId(servers[0].id);
    }
  }, [servers, selectedServerId]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Parse tool call from message (e.g., "@server_name tool_name param1=value1")
      const toolCallMatch = inputText.match(/^@(\S+)\s+(\S+)\s*(.*)/);

      if (toolCallMatch) {
        const [, serverName, toolName, paramsStr] = toolCallMatch;

        // Find server by name
        const server = servers.find((s) =>
          s.name.toLowerCase().includes(serverName.toLowerCase())
        );

        if (!server) {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Server "${serverName}" not found. Available servers: ${servers.map((s) => s.name).join(', ')}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          return;
        }

        // Parse parameters
        const params: Record<string, any> = {};
        if (paramsStr) {
          const paramPairs = paramsStr.split(/\s+/);
          paramPairs.forEach((pair) => {
            const [key, value] = pair.split('=');
            if (key && value) {
              params[key] = value;
            }
          });
        }

        // Execute tool
        const result = await executeTool(server.id, toolName, params) as any;
        // Ensure result has an id
        if (!result.id) {
          result.id = `result-${Date.now()}`;
        }
        await addExecutionResult(result);

        const resultText = (result as any).content
          .map((c: any) => (c.type === 'text' ? c.text : `[${c.type}]`))
          .join('\n');

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resultText,
          toolName,
          serverId: server.id,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Regular chat message
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `To execute a tool, use format: @server_name tool_name param1=value1 param2=value2\n\nAvailable servers: ${servers.map((s) => `${s.name} (${s.toolCount} tools)`).join(', ')}`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      className={`px-4 py-3 mb-2 rounded-lg max-w-xs ${
        item.role === 'user'
          ? 'bg-primary/20 ml-auto border border-primary'
          : 'bg-surface border border-border'
      }`}
    >
      <Text className={`text-sm ${item.role === 'user' ? 'text-foreground' : 'text-muted'}`}>
        {item.toolName && `[${item.toolName}] `}
        {item.content}
      </Text>
      <Text className="text-xs text-muted mt-1">
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScreenContainer className="p-0 flex-col">
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-background">MCP Chat</Text>
          <Text className="text-background text-sm mt-1">
            Execute tools from your connected servers
          </Text>
        </View>

        {/* Server Selector */}
        {servers.length > 0 && (
          <View className="px-6 pt-4 pb-2">
            <Text className="text-xs font-semibold text-muted mb-2">Active Server</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {servers.map((server) => (
                <TouchableOpacity
                  key={server.id}
                  onPress={() => setSelectedServerId(server.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedServerId === server.id
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedServerId === server.id ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {server.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={scrollViewRef as any}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Empty State */}
        {messages.length === 0 && (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialIcons name="chat-bubble-outline" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4 text-center">
              No messages yet
            </Text>
            <Text className="text-muted text-sm mt-2 text-center">
              Use format: @server_name tool_name param1=value1
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View className="border-t border-border px-4 py-4 gap-2">
          {servers.length === 0 ? (
            <View className="bg-warning/10 border border-warning rounded-lg p-3">
              <Text className="text-xs text-foreground">
                No servers connected. Add a server from the Servers tab to get started.
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row gap-2 items-end">
                <TextInput
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="@server_name tool_name param=value"
                  placeholderTextColor={colors.muted}
                  value={inputText}
                  onChangeText={setInputText}
                  editable={!isLoading}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-primary px-4 py-3 rounded-lg items-center justify-center"
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <MaterialIcons name="send" size={20} color={colors.background} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Quick Tools */}
              {serverTools.length > 0 && (
                <View className="gap-1">
                  <Text className="text-xs text-muted font-semibold">Quick Tools</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                    {serverTools.slice(0, 5).map((tool) => (
                      <TouchableOpacity
                        key={tool.name}
                        onPress={() =>
                          setInputText(`@${servers.find((s) => s.id === selectedServerId)?.name || 'server'} ${tool.name}`)
                        }
                        className="bg-primary/10 border border-primary px-3 py-1 rounded-full"
                      >
                        <Text className="text-xs text-primary font-medium">{tool.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
