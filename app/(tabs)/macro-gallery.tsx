import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';
import { MACRO_TEMPLATES, Macro } from '@/lib/models/Macro';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';

export default function MacroGalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    macros,
    loadMacros,
    isExecuting,
    progress,
    error,
    deleteMacro,
    toggleFavorite,
    executeMacro,
  } = useMacroExecution();

  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [filteredMacros, setFilteredMacros] = useState<Macro[]>([]);

  // Load macros on mount
  useEffect(() => {
    loadMacros();
  }, [loadMacros]);

  // Filter macros based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMacros(macros);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = macros.filter(
      (macro) =>
        macro.name.toLowerCase().includes(query) ||
        (macro.description && macro.description.toLowerCase().includes(query)) ||
        (macro.tags && macro.tags.some((tag) => tag.toLowerCase().includes(query)))
    );

    setFilteredMacros(filtered);
  }, [macros, searchQuery]);

  // Handle macro execution
  const handleExecuteMacro = useCallback(
    async (macro: Macro) => {
      try {
        await executeMacro(macro);
        // Navigate to results screen
        router.push('/(tabs)/results');
      } catch (err) {
        Alert.alert('Execution Failed', err instanceof Error ? err.message : 'Unknown error');
      }
    },
    [executeMacro, router]
  );

  // Handle macro deletion
  const handleDeleteMacro = useCallback(
    (macro: Macro) => {
      Alert.alert('Delete Macro', `Are you sure you want to delete "${macro.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMacro(macro.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete macro');
            }
          },
        },
      ]);
    },
    [deleteMacro]
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    async (macro: Macro) => {
      try {
        await toggleFavorite(macro.id);
      } catch (err) {
        Alert.alert('Error', 'Failed to update favorite status');
      }
    },
    [toggleFavorite]
  );

  // Render macro card
  const renderMacroCard = ({ item }: { item: Macro }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/macro-editor?id=${item.id}`)}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderLeftWidth: 4,
          borderLeftColor: item.isFavorite ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{item.name}</Text>
          {item.description && (
            <Text className="text-sm text-muted mt-1 leading-relaxed">{item.description}</Text>
          )}
        </View>
        <Pressable
          onPress={() => handleToggleFavorite(item)}
          className="ml-2"
        >
          <Text className="text-2xl">{item.isFavorite ? '⭐' : '☆'}</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-xs text-muted">Steps</Text>
            <Text className="text-sm font-semibold text-foreground">{item.steps.length}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted">Used</Text>
            <Text className="text-sm font-semibold text-foreground">{item.usageCount}</Text>
          </View>
          {item.lastExecutedAt && (
            <View>
              <Text className="text-xs text-muted">Last</Text>
              <Text className="text-xs text-foreground">
                {new Date(item.lastExecutedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleExecuteMacro(item)}
            className="bg-primary px-3 py-2 rounded-lg"
            disabled={isExecuting}
          >
            <Text className="text-white text-sm font-semibold">Execute</Text>
          </Pressable>

          <Pressable
            onPress={() => handleDeleteMacro(item)}
            className="bg-error/10 px-3 py-2 rounded-lg"
          >
            <Text className="text-error text-sm font-semibold">Delete</Text>
          </Pressable>
        </View>
      </View>

      {item.tags && item.tags.length > 0 && (
        <View className="flex-row gap-2 mt-3 flex-wrap">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">{tag}</Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <View className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">+{item.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );

  // Render template card
  const renderTemplateCard = ({ item }: { item: [string, any] }) => {
    const [key, template] = item;

    return (
      <Pressable
        onPress={() => {
          router.push(`/(tabs)/macro-editor?template=${key}`);
        }}
        style={({ pressed }) => [
          {
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: colors.primary,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text className="text-lg font-bold text-primary">{template.name}</Text>
        <Text className="text-sm text-muted mt-2">{template.description}</Text>
        <View className="flex-row gap-2 mt-3">
          <View className="bg-primary/10 px-2 py-1 rounded">
            <Text className="text-xs text-primary">{template.steps.length} steps</Text>
          </View>
          {template.category && (
            <View className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">{template.category}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const favorites = filteredMacros.filter((m) => m.isFavorite);
  const others = filteredMacros.filter((m) => !m.isFavorite);

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-foreground">Macros</Text>
        <Text className="text-sm text-muted mt-1">
          Save and replay tool execution sequences
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <TextInput
          placeholder="Search macros..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.muted}
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
        />
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3 mb-6">
        <Pressable
          onPress={() => router.push('/(tabs)/macro-editor?new=true')}
          className="flex-1 bg-primary rounded-lg py-3"
        >
          <Text className="text-white font-semibold text-center">+ New Macro</Text>
        </Pressable>

        <Pressable
          onPress={() => setShowTemplates(!showTemplates)}
          className="flex-1 bg-surface border border-border rounded-lg py-3"
        >
          <Text className="text-foreground font-semibold text-center">
            {showTemplates ? 'Hide' : 'Show'} Templates
          </Text>
        </Pressable>
      </View>

      {/* Error Display */}
      {error && (
        <View className="bg-error/10 border border-error rounded-lg p-3 mb-4">
          <Text className="text-error text-sm">{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {isExecuting && (
        <View className="bg-primary/10 border border-primary rounded-lg p-4 mb-4">
          <View className="flex-row items-center gap-3">
            <ActivityIndicator size="small" color={colors.primary} />
            <View className="flex-1">
              <Text className="text-primary font-semibold">Executing macro...</Text>
              <View className="bg-primary/20 h-2 rounded-full mt-2">
                <View
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Templates Section */}
      {showTemplates && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Templates</Text>
          <FlatList
            data={Object.entries(MACRO_TEMPLATES)}
            renderItem={renderTemplateCard}
            keyExtractor={([key]) => key}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Favorites</Text>
          <FlatList
            data={favorites}
            renderItem={renderMacroCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* All Macros Section */}
      {others.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">
            {favorites.length > 0 ? 'Other Macros' : 'All Macros'}
          </Text>
          <FlatList
            data={others}
            renderItem={renderMacroCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Empty State */}
      {filteredMacros.length === 0 && !showTemplates && (
        <View className="flex-1 items-center justify-center py-12">
          <Text className="text-2xl mb-2">📋</Text>
          <Text className="text-lg font-semibold text-foreground">No macros yet</Text>
          <Text className="text-muted text-center mt-2 max-w-xs">
            Create a new macro or use a template to get started
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
