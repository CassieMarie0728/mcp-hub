import { Text, View, TouchableOpacity, FlatList, Alert, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

export default function ServersScreen() {
  const { servers, deleteServer } = useApp();
  const router = useRouter();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServers = servers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteServer = (serverId: string, serverName: string) => {
    Alert.alert(
      'Delete Server',
      `Are you sure you want to delete "${serverName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteServer(serverId);
          },
        },
      ],
    );
  };

  const renderServerCard = ({ item: server }: { item: (typeof servers)[0] }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(tabs)/server-detail?id=${server.id}` as any)}
      className="bg-surface rounded-xl p-4 border border-border mb-3 active:opacity-70"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-base mb-1">{server.name}</Text>
          {server.description && (
            <Text className="text-xs text-muted mb-2">{server.description}</Text>
          )}
        </View>
        <View className="flex-row gap-1">
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/edit-server?id=${server.id}` as any)}
            className="p-2"
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteServer(server.id, server.name)}
            className="p-2"
          >
            <MaterialIcons name="delete" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="items-center">
            <Text className="text-xs text-muted">Tools</Text>
            <Text className="text-lg font-bold text-foreground">{server.toolCount}</Text>
          </View>
          <View className="items-center">
            <Text className="text-xs text-muted">Type</Text>
            <Text className="text-sm font-medium text-foreground capitalize">
              {server.connectionType}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <View
            className={`flex-row items-center gap-2 px-2 py-1 rounded ${
              server.status === 'connected' ? 'bg-success/20' : 'bg-error/20'
            }`}
          >
            <View
              className={`w-2 h-2 rounded-full ${
                server.status === 'connected' ? 'bg-success' : 'bg-error'
              }`}
            />
            <Text
              className={`text-xs font-medium ${
                server.status === 'connected' ? 'text-success' : 'text-error'
              }`}
            >
              {server.status === 'connected' ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6">
        <Text className="text-3xl font-bold text-background mb-4">Servers</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/add-server' as any)}
          className="bg-background rounded-lg px-4 py-3 flex-row items-center justify-center gap-2"
        >
          <MaterialIcons name="add" size={20} color={colors.primary} />
          <Text className="text-primary font-semibold">Add Server</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 pt-4 pb-2">
        <View className="bg-surface rounded-lg border border-border flex-row items-center px-3 py-2">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder="Search servers..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Servers List */}
      <View className="flex-1 px-6 pt-4">
        {filteredServers.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="storage" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4 mb-2">No Servers Yet</Text>
            <Text className="text-sm text-muted text-center mb-6">
              Add your first MCP server to get started exploring and executing tools.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/add-server' as any)}
              className="bg-primary px-6 py-3 rounded-lg"
            >
              <Text className="text-background font-semibold">Add First Server</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredServers}
            renderItem={renderServerCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
