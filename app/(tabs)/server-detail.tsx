import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { MCPTool } from '@/lib/types';

export default function ServerDetailScreen() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { servers, getServerTools } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'tools' | 'info'>('tools');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Server Details',
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <MaterialIcons name="info" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors, router]);

  const server = servers.find((s) => s.id === id);
  const tools = server ? getServerTools(server.id) : [];

  if (!server) {
    return (
      <ScreenContainer className="p-0 items-center justify-center">
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text className="text-foreground font-semibold mt-4">Server Not Found</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/servers' as any)}
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Back to Servers</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const renderToolCard = ({ item: tool }: { item: MCPTool }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/(tabs)/tool-detail?serverId=${server.id}&toolName=${encodeURIComponent(tool.name)}` as any,
        )
      }
      className="bg-surface rounded-lg p-4 border border-border mb-3 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{tool.name}</Text>
          {tool.title && <Text className="text-xs text-muted mt-1">{tool.title}</Text>}
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
      </View>
      <Text className="text-sm text-muted">{tool.description}</Text>
      {tool.inputSchema.required && tool.inputSchema.required.length > 0 && (
        <View className="flex-row items-center gap-2 mt-3">
          <MaterialIcons name="info" size={14} color={colors.warning} />
          <Text className="text-xs text-warning">
            {tool.inputSchema.required.length} required parameter(s)
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.push('/(tabs)/servers' as any)}>
          <MaterialIcons name="chevron-left" size={24} color={colors.background} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-2xl font-bold text-background">{server.name}</Text>
        </View>
      </View>

      {/* Status Bar */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className={`w-3 h-3 rounded-full ${
                server.status === 'connected' ? 'bg-success' : 'bg-error'
              }`}
            />
            <Text
              className={`font-semibold capitalize ${
                server.status === 'connected' ? 'text-success' : 'text-error'
              }`}
            >
              {server.status}
            </Text>
          </View>
          <Text className="text-xs text-muted">
            {server.lastConnected
              ? `Last: ${new Date(server.lastConnected).toLocaleTimeString()}`
              : 'Never connected'}
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row border-b border-border px-6 mt-4">
        {(['tools', 'info'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === tab ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center font-semibold capitalize ${
                activeTab === tab ? 'text-primary' : 'text-muted'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-4">
        {activeTab === 'tools' ? (
          <>
            {tools.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <MaterialIcons name="build" size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4 mb-2">No Tools</Text>
                <Text className="text-sm text-muted text-center">
                  This server hasn&apos;t exposed any tools yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={tools}
                renderItem={renderToolCard}
                keyExtractor={(item) => item.name}
                scrollEnabled={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </>
        ) : (
          <ScrollView>
            <View className="bg-surface rounded-lg p-4 border border-border mb-4">
              <View className="mb-4">
                <Text className="text-xs text-muted mb-1">Server Name</Text>
                <Text className="text-foreground font-semibold">{server.name}</Text>
              </View>
              {server.description && (
                <View className="mb-4">
                  <Text className="text-xs text-muted mb-1">Description</Text>
                  <Text className="text-foreground">{server.description}</Text>
                </View>
              )}
              <View className="mb-4">
                <Text className="text-xs text-muted mb-1">Connection Type</Text>
                <Text className="text-foreground font-semibold capitalize">
                  {server.connectionType}
                </Text>
              </View>
              <View className="mb-4">
                <Text className="text-xs text-muted mb-1">Tools Available</Text>
                <Text className="text-foreground font-semibold">{server.toolCount}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Created</Text>
                <Text className="text-foreground">
                  {new Date(server.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {server.error && (
              <View className="bg-error/10 rounded-lg p-4 border border-error/20 mb-4">
                <View className="flex-row gap-2">
                  <MaterialIcons name="error-outline" size={16} color={colors.error} />
                  <Text className="text-error flex-1 text-sm">{server.error}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
