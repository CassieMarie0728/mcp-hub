import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Analytics Dashboard Screen
 * View macro performance metrics and usage statistics
 */
export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const colors = useColors();

  // State
  const [view, setView] = useState<'overview' | 'macros' | 'users'>('overview');
  const [globalMetrics, setGlobalMetrics] = useState<any>({
    totalExecutions: 1250,
    totalSuccessful: 1180,
    totalFailed: 70,
    averageDuration: 1250,
    topMacros: [
      { name: 'Send Message', executions: 450, successRate: 98 },
      { name: 'Open App', executions: 320, successRate: 95 },
      { name: 'Take Screenshot', executions: 280, successRate: 99 },
    ],
    topUsers: [
      { name: 'John Doe', executions: 280, averageDuration: 1100 },
      { name: 'Jane Smith', executions: 210, averageDuration: 1300 },
      { name: 'Mike Johnson', executions: 190, averageDuration: 950 },
    ],
  });

  const [macroMetrics, setMacroMetrics] = useState<any[]>([
    {
      id: 'macro_1',
      name: 'Send WhatsApp Message',
      executions: 450,
      successful: 441,
      failed: 9,
      successRate: 98,
      avgDuration: 1200,
      lastRun: new Date(Date.now() - 300000),
    },
    {
      id: 'macro_2',
      name: 'Open Instagram',
      executions: 320,
      successful: 304,
      failed: 16,
      successRate: 95,
      avgDuration: 1450,
      lastRun: new Date(Date.now() - 600000),
    },
    {
      id: 'macro_3',
      name: 'Take Screenshot',
      executions: 280,
      successful: 277,
      failed: 3,
      successRate: 99,
      avgDuration: 850,
      lastRun: new Date(Date.now() - 120000),
    },
  ]);

  /**
   * Calculate success rate
   */
  const getSuccessRate = () => {
    if (globalMetrics.totalExecutions === 0) return 0;
    return ((globalMetrics.totalSuccessful / globalMetrics.totalExecutions) * 100).toFixed(1);
  };

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  /**
   * Render overview
   */
  const renderOverview = () => (
    <View className="gap-4">
      {/* Key Metrics */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted">KEY METRICS</Text>
        <View className="grid gap-2">
          <View className="flex-row gap-2">
            <View className="flex-1 bg-success/10 rounded-lg p-4 border border-success">
              <Text className="text-xs text-muted">Total Executions</Text>
              <Text className="text-2xl font-bold text-success mt-1">{globalMetrics.totalExecutions}</Text>
            </View>
            <View className="flex-1 bg-primary/10 rounded-lg p-4 border border-primary">
              <Text className="text-xs text-muted">Success Rate</Text>
              <Text className="text-2xl font-bold text-primary mt-1">{getSuccessRate()}%</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 bg-warning/10 rounded-lg p-4 border border-warning">
              <Text className="text-xs text-muted">Avg Duration</Text>
              <Text className="text-2xl font-bold text-warning mt-1">{formatDuration(globalMetrics.averageDuration)}</Text>
            </View>
            <View className="flex-1 bg-error/10 rounded-lg p-4 border border-error">
              <Text className="text-xs text-muted">Failed</Text>
              <Text className="text-2xl font-bold text-error mt-1">{globalMetrics.totalFailed}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Top Macros */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted">TOP MACROS</Text>
        <FlatList
          scrollEnabled={false}
          data={globalMetrics.topMacros}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View className="bg-surface rounded-lg p-3 mb-2 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">#{index + 1} {item.name}</Text>
                  <Text className="text-xs text-muted mt-1">{item.executions} executions</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-success">{item.successRate}%</Text>
                  <Text className="text-xs text-muted">success</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>

      {/* Top Users */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted">TOP USERS</Text>
        <FlatList
          scrollEnabled={false}
          data={globalMetrics.topUsers}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View className="bg-surface rounded-lg p-3 mb-2 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">#{index + 1} {item.name}</Text>
                  <Text className="text-xs text-muted mt-1">{item.executions} executions</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-primary">{formatDuration(item.averageDuration)}</Text>
                  <Text className="text-xs text-muted">avg</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );

  /**
   * Render macro metrics
   */
  const renderMacroMetrics = () => (
    <View className="gap-2">
      <FlatList
        scrollEnabled={false}
        data={macroMetrics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable className="bg-surface rounded-lg p-4 mb-3 border border-border active:opacity-70">
            <View className="gap-3">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted mt-1">
                    Last run: {item.lastRun.toLocaleTimeString()}
                  </Text>
                </View>
                <View className="bg-primary/20 rounded-full px-2 py-1">
                  <Text className="text-xs font-bold text-primary">{item.successRate}%</Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted">Executions</Text>
                  <Text className="text-lg font-bold text-foreground mt-1">{item.executions}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Successful</Text>
                  <Text className="text-lg font-bold text-success mt-1">{item.successful}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Failed</Text>
                  <Text className="text-lg font-bold text-error mt-1">{item.failed}</Text>
                </View>
              </View>

              <View className="bg-background rounded-lg p-2">
                <Text className="text-xs text-muted">Avg Duration</Text>
                <Text className="text-base font-semibold text-foreground mt-1">
                  {formatDuration(item.avgDuration)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );

  /**
   * Render user metrics
   */
  const renderUserMetrics = () => (
    <View className="gap-2">
      <FlatList
        scrollEnabled={false}
        data={globalMetrics.topUsers}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Pressable className="bg-surface rounded-lg p-4 mb-3 border border-border active:opacity-70">
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-muted">Total Executions</Text>
                  <Text className="text-lg font-bold text-foreground mt-1">{item.executions}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Avg Duration</Text>
                  <Text className="text-lg font-bold text-foreground mt-1">
                    {formatDuration(item.averageDuration)}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Analytics</Text>
            <Text className="text-base text-muted">Macro performance and usage metrics</Text>
          </View>

          {/* View Tabs */}
          <View className="flex-row gap-2">
            {['overview', 'macros', 'users'].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setView(tab as any)}
                className={cn(
                  'flex-1 rounded-lg p-3 active:opacity-80',
                  view === tab ? 'bg-primary' : 'bg-surface border border-border'
                )}
              >
                <Text
                  className={cn(
                    'text-center text-xs font-semibold capitalize',
                    view === tab ? 'text-background' : 'text-foreground'
                  )}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {view === 'overview' && renderOverview()}
          {view === 'macros' && renderMacroMetrics()}
          {view === 'users' && renderUserMetrics()}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
