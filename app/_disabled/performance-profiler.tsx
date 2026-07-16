import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Performance Profiler Screen
 * Shows macro execution timeline, bottlenecks, and optimization suggestions
 */
export default function PerformanceProfilerScreen() {
  const router = useRouter();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<'timeline' | 'bottlenecks' | 'suggestions'>(
    'timeline',
  );

  // Mock performance data
  const stats = {
    totalExecutions: 45,
    successRate: 94.2,
    avgDuration: 3240,
    minDuration: 1850,
    maxDuration: 5920,
  };

  const timeline = [
    { action: 'Tap', duration: 450, percent: 14 },
    { action: 'Wait', duration: 1200, percent: 37 },
    { action: 'Type', duration: 680, percent: 21 },
    { action: 'Scroll', duration: 560, percent: 17 },
    { action: 'Tap', duration: 350, percent: 11 },
  ];

  const bottlenecks = [
    {
      id: '1',
      action: 'Wait (Line 12)',
      duration: 1200,
      percent: 37,
      severity: 'critical',
      reason: 'Explicit wait time',
    },
    {
      id: '2',
      action: 'Type (Line 18)',
      duration: 680,
      percent: 21,
      severity: 'high',
      reason: 'Text input operation',
    },
    {
      id: '3',
      action: 'Scroll (Line 25)',
      duration: 560,
      percent: 17,
      severity: 'medium',
      reason: 'Scrolling operation',
    },
  ];

  const suggestions = [
    {
      id: '1',
      title: 'Reduce explicit waits',
      description: 'Found 3 explicit waits. Consider using element detection instead.',
      improvement: '~35% faster',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Optimize scrolling',
      description: 'Use direct coordinates instead of scroll operations.',
      improvement: '~15% faster',
      priority: 'medium',
    },
    {
      id: '3',
      title: 'Batch operations',
      description: 'Group related actions together for better performance.',
      improvement: '~10% faster',
      priority: 'medium',
    },
  ];

  /**
   * Render timeline bar
   */
  const renderTimelineBar = ({ item }: { item: any }) => (
    <View key={item.action} className="gap-1 mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">{item.action}</Text>
        <Text className="text-xs text-muted">
          {item.duration}ms ({item.percent}%)
        </Text>
      </View>

      <View className="h-2 bg-surface rounded-full border border-border overflow-hidden">
        <View className="h-full bg-primary rounded-full" style={{ width: `${item.percent}%` }} />
      </View>
    </View>
  );

  /**
   * Render bottleneck card
   */
  const renderBottleneckCard = ({ item }: { item: any }) => (
    <View key={item.id} className="bg-surface rounded-xl p-4 mb-3 border border-border gap-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{item.action}</Text>
          <Text className="text-xs text-muted mt-1">{item.reason}</Text>
        </View>

        <View
          className={cn(
            'rounded-full px-2 py-1',
            item.severity === 'critical' && 'bg-error/20',
            item.severity === 'high' && 'bg-warning/20',
            item.severity === 'medium' && 'bg-primary/20',
          )}
        >
          <Text
            className={cn(
              'text-xs font-bold',
              item.severity === 'critical' && 'text-error',
              item.severity === 'high' && 'text-warning',
              item.severity === 'medium' && 'text-primary',
            )}
          >
            {item.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-muted">{item.duration}ms</Text>
        <View className="flex-1 h-1 bg-surface rounded-full border border-border overflow-hidden">
          <View
            className={cn(
              'h-full rounded-full',
              item.severity === 'critical' && 'bg-error',
              item.severity === 'high' && 'bg-warning',
              item.severity === 'medium' && 'bg-primary',
            )}
            style={{ width: `${item.percent}%` }}
          />
        </View>
        <Text className="text-xs text-muted">{item.percent}%</Text>
      </View>
    </View>
  );

  /**
   * Render suggestion card
   */
  const renderSuggestionCard = ({ item }: { item: any }) => (
    <View key={item.id} className="bg-surface rounded-xl p-4 mb-3 border border-border gap-2">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{item.title}</Text>
          <Text className="text-xs text-muted mt-1">{item.description}</Text>
        </View>

        <View className="bg-success/20 rounded-full px-2 py-1">
          <Text className="text-xs font-bold text-success">{item.improvement}</Text>
        </View>
      </View>

      <Pressable className="bg-primary rounded-lg p-2 active:opacity-80">
        <Text className="text-center font-semibold text-background text-sm">Apply Fix</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Performance Profiler</Text>
            <Text className="text-base text-muted">Analyze and optimize macro execution</Text>
          </View>

          {/* Statistics */}
          <View className="gap-2">
            <View className="flex-row gap-2">
              <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted">Avg Duration</Text>
                <Text className="text-2xl font-bold text-foreground">
                  {(stats.avgDuration / 1000).toFixed(2)}s
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted">Success Rate</Text>
                <Text className="text-2xl font-bold text-success">{stats.successRate}%</Text>
              </View>

              <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted">Executions</Text>
                <Text className="text-2xl font-bold text-foreground">{stats.totalExecutions}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted">Min Duration</Text>
                <Text className="text-lg font-bold text-foreground">
                  {(stats.minDuration / 1000).toFixed(2)}s
                </Text>
              </View>

              <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
                <Text className="text-xs text-muted">Max Duration</Text>
                <Text className="text-lg font-bold text-foreground">
                  {(stats.maxDuration / 1000).toFixed(2)}s
                </Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1 border border-border">
            <Pressable
              onPress={() => setActiveTab('timeline')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'timeline' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'timeline' ? 'text-background' : 'text-foreground',
                )}
              >
                Timeline
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('bottlenecks')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'bottlenecks' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'bottlenecks' ? 'text-background' : 'text-foreground',
                )}
              >
                Bottlenecks
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('suggestions')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'suggestions' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'suggestions' ? 'text-background' : 'text-foreground',
                )}
              >
                Suggestions
              </Text>
            </Pressable>
          </View>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">EXECUTION BREAKDOWN</Text>
              <FlatList
                scrollEnabled={false}
                data={timeline}
                keyExtractor={(item) => item.action}
                renderItem={renderTimelineBar}
              />
            </View>
          )}

          {/* Bottlenecks Tab */}
          {activeTab === 'bottlenecks' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">PERFORMANCE ISSUES</Text>
              <FlatList
                scrollEnabled={false}
                data={bottlenecks}
                keyExtractor={(item) => item.id}
                renderItem={renderBottleneckCard}
              />
            </View>
          )}

          {/* Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">OPTIMIZATION TIPS</Text>
              <FlatList
                scrollEnabled={false}
                data={suggestions}
                keyExtractor={(item) => item.id}
                renderItem={renderSuggestionCard}
              />
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80 mt-4"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
