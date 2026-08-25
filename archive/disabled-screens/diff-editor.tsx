import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Diff Editor Screen
 * Interactive diff editing with suggestions and one-click apply
 */
export default function DiffEditorScreen() {
  const router = useRouter();
  const colors = useColors();

  const [suggestions, setSuggestions] = useState<any[]>([
    {
      id: 'sugg1',
      type: 'add',
      line: 'Add exponential backoff for retries',
      reason: 'Exponential backoff reduces server load and improves success rates',
      confidence: 0.95,
      impact: 'high',
      applied: false,
    },
    {
      id: 'sugg2',
      type: 'suggest',
      line: 'Consider adding caching for repeated operations',
      reason: 'Caching can significantly improve performance',
      confidence: 0.85,
      impact: 'high',
      applied: false,
    },
    {
      id: 'sugg3',
      type: 'suggest',
      line: 'Add error handling for robustness',
      reason: 'Error handling prevents unexpected failures',
      confidence: 0.9,
      impact: 'high',
      applied: false,
    },
    {
      id: 'sugg4',
      type: 'remove',
      line: 'Remove deprecated delay parameter',
      reason: 'This parameter is no longer supported',
      confidence: 0.88,
      impact: 'medium',
      applied: false,
    },
    {
      id: 'sugg5',
      type: 'suggest',
      line: 'Add input validation',
      reason: 'Validation prevents invalid data from causing issues',
      confidence: 0.8,
      impact: 'medium',
      applied: false,
    },
  ]);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);

  /**
   * Get suggestion icon
   */
  const getSuggestionIcon = (type: string) => {
    const icons: Record<string, string> = {
      add: '➕',
      remove: '➖',
      modify: '✏️',
      suggest: '💡',
    };
    return icons[type] || '📝';
  };

  /**
   * Get impact color
   */
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-error/10 border-error';
      case 'medium':
        return 'bg-warning/10 border-warning';
      case 'low':
        return 'bg-success/10 border-success';
      default:
        return 'bg-surface border-border';
    }
  };

  /**
   * Apply suggestion
   */
  const applySuggestion = (id: string) => {
    setSuggestions(
      suggestions.map((s) => (s.id === id ? { ...s, applied: true } : s))
    );

    Alert.alert('Success', 'Suggestion applied successfully');
  };

  /**
   * Reject suggestion
   */
  const rejectSuggestion = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  /**
   * Auto-apply safe suggestions
   */
  const autoApplySafe = () => {
    const safeSuggestions = suggestions.filter(
      (s) => s.confidence > 0.9 && s.impact === 'high'
    );

    setSuggestions(
      suggestions.map((s) =>
        safeSuggestions.find((safe) => safe.id === s.id)
          ? { ...s, applied: true }
          : s
      )
    );

    Alert.alert('Success', `Applied ${safeSuggestions.length} safe suggestions`);
  };

  /**
   * Filter suggestions
   */
  const filteredSuggestions = suggestions.filter((s) => {
    if (filterType && s.type !== filterType) return false;
    if (showAppliedOnly && !s.applied) return false;
    return true;
  });

  /**
   * Render suggestion card
   */
  const renderSuggestionCard = ({ item }: { item: any }) => (
    <Pressable
      className={cn(
        'rounded-xl p-4 mb-3 border',
        getImpactColor(item.impact),
        item.applied && 'opacity-60'
      )}
    >
      <View className="gap-3">
        {/* Header */}
        <View className="flex-row items-start gap-3">
          <Text className="text-2xl">{getSuggestionIcon(item.type)}</Text>

          <View className="flex-1 gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-foreground flex-1">{item.line}</Text>
              {item.applied && (
                <View className="bg-success/20 rounded-full px-2 py-1">
                  <Text className="text-xs font-bold text-success">✓ Applied</Text>
                </View>
              )}
            </View>

            <Text className="text-sm text-muted">{item.reason}</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-2 items-center">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-muted">Confidence:</Text>
            <View className="bg-primary/20 rounded px-2 py-1">
              <Text className="text-xs font-bold text-primary">{(item.confidence * 100).toFixed(0)}%</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-muted">Impact:</Text>
            <View
              className={cn(
                'rounded px-2 py-1',
                item.impact === 'high'
                  ? 'bg-error/20'
                  : item.impact === 'medium'
                    ? 'bg-warning/20'
                    : 'bg-success/20'
              )}
            >
              <Text
                className={cn(
                  'text-xs font-bold',
                  item.impact === 'high'
                    ? 'text-error'
                    : item.impact === 'medium'
                      ? 'text-warning'
                      : 'text-success'
                )}
              >
                {item.impact}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {!item.applied && (
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => applySuggestion(item.id)}
              className="flex-1 bg-success rounded-lg p-2 active:opacity-80"
            >
              <Text className="text-center font-semibold text-background text-sm">Apply</Text>
            </Pressable>

            <Pressable
              onPress={() => rejectSuggestion(item.id)}
              className="flex-1 bg-error/20 border border-error rounded-lg p-2 active:opacity-80"
            >
              <Text className="text-center font-semibold text-error text-sm">Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );

  const appliedCount = suggestions.filter((s) => s.applied).length;
  const pendingCount = suggestions.filter((s) => !s.applied).length;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Diff Editor</Text>
            <Text className="text-base text-muted">Review and apply intelligent suggestions</Text>
          </View>

          {/* Stats */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Total</Text>
              <Text className="text-2xl font-bold text-foreground">{suggestions.length}</Text>
            </View>

            <View className="flex-1 bg-success/10 rounded-lg p-3 border border-success">
              <Text className="text-xs text-muted">Applied</Text>
              <Text className="text-2xl font-bold text-success">{appliedCount}</Text>
            </View>

            <View className="flex-1 bg-warning/10 rounded-lg p-3 border border-warning">
              <Text className="text-xs text-muted">Pending</Text>
              <Text className="text-2xl font-bold text-warning">{pendingCount}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {pendingCount > 0 && (
              <Pressable
                onPress={autoApplySafe}
                className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-background">Auto-Apply Safe</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowAppliedOnly(!showAppliedOnly)}
              className={cn(
                'flex-1 rounded-lg p-3 active:opacity-80 border',
                showAppliedOnly ? 'bg-primary border-primary' : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold',
                  showAppliedOnly ? 'text-background' : 'text-foreground'
                )}
              >
                Applied Only
              </Text>
            </Pressable>
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <Pressable
              onPress={() => setFilterType(null)}
              className={cn(
                'px-4 py-2 rounded-full border',
                filterType === null ? 'bg-primary border-primary' : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'font-semibold text-sm',
                  filterType === null ? 'text-background' : 'text-foreground'
                )}
              >
                All
              </Text>
            </Pressable>

            {['add', 'remove', 'modify', 'suggest'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setFilterType(filterType === type ? null : type)}
                className={cn(
                  'px-4 py-2 rounded-full border',
                  filterType === type ? 'bg-primary border-primary' : 'bg-surface border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    filterType === type ? 'text-background' : 'text-foreground'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Suggestions List */}
          {filteredSuggestions.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={filteredSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestionCard}
            />
          ) : (
            <View className="bg-surface rounded-xl p-8 border border-border items-center gap-2">
              <Text className="text-2xl">✨</Text>
              <Text className="text-lg font-semibold text-foreground">All caught up!</Text>
              <Text className="text-sm text-muted text-center">
                {showAppliedOnly ? 'No applied suggestions' : 'No pending suggestions'}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 bg-surface border border-border rounded-lg p-4 active:opacity-80"
            >
              <Text className="text-center font-semibold text-foreground">Back</Text>
            </Pressable>

            {appliedCount > 0 && (
              <Pressable
                onPress={() => Alert.alert('Success', 'Changes saved and applied')}
                className="flex-1 bg-primary rounded-lg p-4 active:opacity-80"
              >
                <Text className="text-center font-semibold text-background">Save Changes</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
