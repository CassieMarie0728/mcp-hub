import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { useServerPresets } from '@/lib/hooks/useServerPresets';
import { ServerPreset, TransportType } from '@/lib/models/ServerPreset';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function ServerPresetsScreen() {
  const colors = useColors();
  const {
    presets,
    favorites,
    recentlyUsed,
    isLoading,
    error,
    loadPresets,
    createFromTemplate,
    deletePreset,
    toggleFavorite,
    getTemplates,
  } = useServerPresets();

  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewPreset, setShowNewPreset] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newPreset, setNewPreset] = useState({
    name: '',
    host: 'localhost',
    port: 3001,
    transport: TransportType.HTTP,
  });

  const templates = getTemplates();

  // Filter presets
  const filteredPresets = presets.filter(
    (p) =>
      searchText === '' ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.host.toLowerCase().includes(searchText.toLowerCase())
  );

  // Handle create from template
  const handleCreateFromTemplate = async (templateKey: string) => {
    try {
      await createFromTemplate(templateKey);
      setShowTemplates(false);
      Alert.alert('Success', 'Preset created from template');
    } catch (err) {
      Alert.alert('Error', 'Failed to create preset from template');
    }
  };

  // Handle delete
  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Preset', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePreset(id),
      },
    ]);
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle favorite');
    }
  };

  // Get transport icon
  const getTransportIcon = (transport: TransportType) => {
    switch (transport) {
      case TransportType.HTTP:
      case TransportType.HTTPS:
        return '🌐';
      case TransportType.WEBSOCKET:
      case TransportType.WSS:
        return '🔗';
      case TransportType.STDIO:
        return '📝';
      default:
        return '⚙️';
    }
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground mb-2">Server Presets</Text>
          <Text className="text-base text-muted">Save and manage frequently-used servers</Text>
        </View>

        {/* Action Buttons */}
        <View className="px-6 mb-6 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-lg py-3 items-center"
            onPress={() => setShowTemplates(true)}
          >
            <Text className="text-base font-semibold text-background">📋 Use Template</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-primary/20 rounded-lg py-3 items-center border border-primary"
            onPress={() => setShowNewPreset(true)}
          >
            <Text className="text-base font-semibold text-primary">➕ New Preset</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-6 mb-6">
          <View className="bg-surface rounded-lg border border-border px-4 py-3 flex-row items-center">
            <Text className="text-foreground mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-foreground"
              placeholder="Search presets..."
              placeholderTextColor={colors.muted}
              onChangeText={setSearchText}
              value={searchText}
            />
          </View>
        </View>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">⭐ Favorites</Text>
            <View className="gap-2">
              {favorites.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onToggleFavorite={() => handleToggleFavorite(preset.id)}
                  onDelete={() => handleDelete(preset.id, preset.name)}
                  colors={colors}
                  getTransportIcon={getTransportIcon}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recently Used Section */}
        {recentlyUsed.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">🕐 Recently Used</Text>
            <View className="gap-2">
              {recentlyUsed.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onToggleFavorite={() => handleToggleFavorite(preset.id)}
                  onDelete={() => handleDelete(preset.id, preset.name)}
                  colors={colors}
                  getTransportIcon={getTransportIcon}
                />
              ))}
            </View>
          </View>
        )}

        {/* All Presets Section */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            All Presets ({filteredPresets.length})
          </Text>

          {isLoading ? (
            <View className="items-center justify-center py-8">
              <Text className="text-muted">Loading presets...</Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-8">
              <Text className="text-error text-center">{error}</Text>
            </View>
          ) : filteredPresets.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Text className="text-muted text-center">No presets found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPresets}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <PresetCard
                  preset={item}
                  onToggleFavorite={() => handleToggleFavorite(item.id)}
                  onDelete={() => handleDelete(item.id, item.name)}
                  colors={colors}
                  getTransportIcon={getTransportIcon}
                />
              )}
              ItemSeparatorComponent={() => <View className="h-2" />}
            />
          )}
        </View>
      </ScrollView>

      {/* Templates Modal */}
      <Modal visible={showTemplates} animationType="slide" transparent>
        <ScreenContainer className="flex-1 bg-background">
          <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-foreground">Server Templates</Text>
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Text className="text-2xl text-foreground">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pb-6">
            {Object.entries(templates).map(([key, template]) => (
              <TouchableOpacity
                key={key}
                className="bg-surface rounded-xl p-4 mb-3 border border-border"
                onPress={() => handleCreateFromTemplate(key)}
              >
                <Text className="text-base font-bold text-foreground mb-1">{template.name}</Text>
                <Text className="text-sm text-muted mb-3">{template.description}</Text>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-muted">
                    {template.host}:{template.port}
                  </Text>
                  <Text className="text-xs text-primary font-semibold">{template.transport}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScreenContainer>
      </Modal>

      {/* New Preset Modal */}
      <Modal visible={showNewPreset} animationType="slide" transparent>
        <ScreenContainer className="flex-1 bg-background">
          <View className="px-6 pt-6 pb-4 flex-row justify-between items-center">
            <Text className="text-2xl font-bold text-foreground">New Preset</Text>
            <TouchableOpacity onPress={() => setShowNewPreset(false)}>
              <Text className="text-2xl text-foreground">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pb-6">
            <Text className="text-sm font-semibold text-muted mb-2">Preset Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholder="My Server"
              placeholderTextColor={colors.muted}
              value={newPreset.name}
              onChangeText={(text) => setNewPreset({ ...newPreset, name: text })}
            />

            <Text className="text-sm font-semibold text-muted mb-2">Host</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholder="localhost"
              placeholderTextColor={colors.muted}
              value={newPreset.host}
              onChangeText={(text) => setNewPreset({ ...newPreset, host: text })}
            />

            <Text className="text-sm font-semibold text-muted mb-2">Port</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholder="3001"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              value={newPreset.port.toString()}
              onChangeText={(text) => setNewPreset({ ...newPreset, port: parseInt(text) || 0 })}
            />

            <Text className="text-sm font-semibold text-muted mb-2">Transport</Text>
            <View className="flex-row gap-2 mb-6">
              {Object.values(TransportType).map((transport) => (
                <TouchableOpacity
                  key={transport}
                  className={cn(
                    'flex-1 py-2 rounded-lg border',
                    newPreset.transport === transport
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  )}
                  onPress={() => setNewPreset({ ...newPreset, transport })}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold text-center',
                      newPreset.transport === transport ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {transport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-primary rounded-lg py-3 items-center mb-3"
              onPress={() => {
                // TODO: Implement create preset
                setShowNewPreset(false);
              }}
            >
              <Text className="text-base font-semibold text-background">Create Preset</Text>
            </TouchableOpacity>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

// Preset Card Component
function PresetCard({
  preset,
  onToggleFavorite,
  onDelete,
  colors,
  getTransportIcon,
}: {
  preset: ServerPreset;
  onToggleFavorite: () => void;
  onDelete: () => void;
  colors: any;
  getTransportIcon: (transport: TransportType) => string;
}) {
  return (
    <View className="bg-surface rounded-xl p-4 border border-border">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{preset.name}</Text>
          <Text className="text-sm text-muted">
            {getTransportIcon(preset.transport)} {preset.host}:{preset.port}
          </Text>
        </View>
        <TouchableOpacity onPress={onToggleFavorite}>
          <Text className="text-xl">{preset.isFavorite ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {preset.description && (
        <Text className="text-sm text-muted mb-3">{preset.description}</Text>
      )}

      <View className="flex-row justify-between items-center pb-3 border-b border-border mb-3">
        <View>
          <Text className="text-xs text-muted">Used {preset.usageCount} times</Text>
          {preset.lastUsedAt && (
            <Text className="text-xs text-muted">
              Last: {new Date(preset.lastUsedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        {preset.tags && preset.tags.length > 0 && (
          <View className="flex-row gap-1">
            {preset.tags.slice(0, 2).map((tag) => (
              <View key={tag} className="bg-primary/20 rounded px-2 py-1">
                <Text className="text-xs text-primary font-semibold">{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="flex-row gap-2">
        <TouchableOpacity className="flex-1 bg-primary/20 rounded-lg py-2 items-center" onPress={() => console.log('Connect')}>
          <Text className="text-sm font-semibold text-primary">Connect</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-error/20 rounded-lg py-2 items-center" onPress={onDelete}>
          <Text className="text-sm font-semibold text-error">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
