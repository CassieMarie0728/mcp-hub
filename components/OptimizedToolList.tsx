import React, { useMemo, useCallback, memo } from 'react';
import { FlatList, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface Tool {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
}

interface ToolListProps {
  tools: Tool[];
  isLoading?: boolean;
  onSelectTool: (tool: Tool) => void;
  searchQuery?: string;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
}

/**
 * Memoized tool item component
 * Prevents unnecessary re-renders
 */
const ToolItem = memo(
  ({ tool, onPress, colors }: { tool: Tool; onPress: (tool: Tool) => void; colors: any }) => (
    <Pressable
      onPress={() => onPress(tool)}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingVertical: 12,
          paddingHorizontal: 16,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text className="text-base font-semibold text-foreground">{tool.name}</Text>
      {tool.description && (
        <Text className="text-sm text-muted mt-2 leading-relaxed">{tool.description}</Text>
      )}
      {tool.tags && tool.tags.length > 0 && (
        <View className="flex-row gap-2 mt-2 flex-wrap">
          {tool.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">{tag}</Text>
            </View>
          ))}
          {tool.tags.length > 3 && (
            <View className="bg-primary/10 px-2 py-1 rounded">
              <Text className="text-xs text-primary">+{tool.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  ),
  (prevProps, nextProps) => {
    // Custom comparison for memo
    return (
      prevProps.tool.name === nextProps.tool.name &&
      prevProps.tool.description === nextProps.tool.description &&
      JSON.stringify(prevProps.tool.tags) === JSON.stringify(nextProps.tool.tags)
    );
  },
);

ToolItem.displayName = 'ToolItem';

/**
 * Optimized tool list with virtualization
 * Uses FlatList for efficient rendering of large lists
 */
export const OptimizedToolList = React.memo(
  ({
    tools,
    isLoading = false,
    onSelectTool,
    searchQuery = '',
    onEndReached,
    isLoadingMore = false,
  }: ToolListProps) => {
    const colors = useColors();

    // Filter and memoize tools based on search query
    const filteredTools = useMemo(() => {
      if (!searchQuery.trim()) {
        return tools;
      }

      const query = searchQuery.toLowerCase();
      return tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          (tool.description && tool.description.toLowerCase().includes(query)) ||
          (tool.tags && tool.tags.some((tag) => tag.toLowerCase().includes(query))),
      );
    }, [tools, searchQuery]);

    // Memoize render function
    const renderItem = useCallback(
      ({ item }: { item: Tool }) => <ToolItem tool={item} onPress={onSelectTool} colors={colors} />,
      [onSelectTool, colors],
    );

    // Memoize key extractor
    const keyExtractor = useCallback((item: Tool, index: number) => `${item.name}-${index}`, []);

    // Render loading state
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">Loading tools...</Text>
        </View>
      );
    }

    // Render empty state
    if (filteredTools.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-lg font-semibold text-foreground">No tools found</Text>
          <Text className="text-muted mt-2 text-center">
            {searchQuery ? `No tools match "${searchQuery}"` : 'No tools available'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredTools}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    );
  },
);

OptimizedToolList.displayName = 'OptimizedToolList';
