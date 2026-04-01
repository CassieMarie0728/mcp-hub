import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useExecutionHistory } from '@/lib/hooks/useExecutionHistory';
import { ExecutionStatus } from '@/lib/models/ExecutionHistory';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export default function ExecutionHistoryScreen() {
  const colors = useColors();
  const { history, isLoading, error, stats, loadHistory, deleteExecution, clearAll, getStats } =
    useExecutionHistory();
  const [selectedFilter, setSelectedFilter] = useState<ExecutionStatus | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');

  // Load stats on mount
  React.useEffect(() => {
    getStats();
  }, [getStats]);

  // Filter history
  const filteredHistory = history.filter((entry) => {
    const matchesStatus = selectedFilter === 'ALL' || entry.status === selectedFilter;
    const matchesSearch =
      searchText === '' ||
      entry.toolName.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.serverName.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle delete
  const handleDelete = (id: string) => {
    Alert.alert('Delete Execution', 'Are you sure you want to delete this execution?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExecution(id),
      },
    ]);
  };

  // Handle clear all
  const handleClearAll = () => {
    Alert.alert('Clear All History', 'This will delete all execution history. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => clearAll(),
      },
    ]);
  };

  // Get status color
  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        return colors.success;
      case ExecutionStatus.FAILED:
        return colors.error;
      case ExecutionStatus.TIMEOUT:
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground mb-2">Execution History</Text>
          <Text className="text-base text-muted">View and manage past tool executions</Text>
        </View>

        {/* Stats */}
        {stats && (
          <View className="px-6 mb-6">
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between mb-4">
                <View>
                  <Text className="text-sm text-muted mb-1">Total Executions</Text>
                  <Text className="text-2xl font-bold text-foreground">{stats.totalExecutions}</Text>
                </View>
                <View>
                  <Text className="text-sm text-muted mb-1">Success Rate</Text>
                  <Text className="text-2xl font-bold text-success">
                    {stats.totalExecutions > 0
                      ? Math.round((stats.successCount / stats.totalExecutions) * 100)
                      : 0}
                    %
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-muted mb-1">Avg Time</Text>
                  <Text className="text-2xl font-bold text-primary">
                    {formatDuration(stats.averageExecutionTimeMs)}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between pt-4 border-t border-border">
                <View className="flex-1">
                  <Text className="text-xs text-success font-semibold">{stats.successCount} Success</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-error font-semibold">{stats.failureCount} Failed</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-warning font-semibold">{stats.timeoutCount} Timeout</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Search */}
        <View className="px-6 mb-4">
          <View className="bg-surface rounded-lg border border-border px-4 py-3 flex-row items-center">
            <Text className="text-foreground mr-2">🔍</Text>
            <Text
              className="flex-1 text-foreground"
              placeholder="Search by tool or server..."
              placeholderTextColor={colors.muted}
              onChangeText={setSearchText}
              value={searchText}
            />
          </View>
        </View>

        {/* Status Filter */}
        <View className="px-6 mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {['ALL', ExecutionStatus.SUCCESS, ExecutionStatus.FAILED, ExecutionStatus.TIMEOUT].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setSelectedFilter(status as any)}
                className={cn(
                  'px-4 py-2 rounded-full border',
                  selectedFilter === status
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    selectedFilter === status ? 'text-background' : 'text-foreground'
                  )}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* History List */}
        <View className="flex-1 px-6 pb-6">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted">Loading history...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-error text-center">{error}</Text>
            </View>
          ) : filteredHistory.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted text-center">No executions found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
                  {/* Tool & Server */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{item.toolName}</Text>
                      <Text className="text-sm text-muted">{item.serverName}</Text>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getStatusColor(item.status) + '20' }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: getStatusColor(item.status) }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Metadata */}
                  <View className="flex-row justify-between mb-3 pb-3 border-b border-border">
                    <View>
                      <Text className="text-xs text-muted">Time: {formatTime(item.timestamp)}</Text>
                      <Text className="text-xs text-muted">Duration: {formatDuration(item.executionTimeMs)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xs text-muted">Result: {item.resultType}</Text>
                      <Text className="text-xs text-muted">Size: {(item.resultSize / 1024).toFixed(1)}KB</Text>
                    </View>
                  </View>

                  {/* Error (if any) */}
                  {item.error && (
                    <View className="bg-error/10 rounded-lg p-2 mb-3">
                      <Text className="text-xs font-semibold text-error">{item.error.code}</Text>
                      <Text className="text-xs text-error">{item.error.message}</Text>
                    </View>
                  )}

                  {/* Actions */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 bg-primary/20 rounded-lg py-2 items-center"
                      onPress={() => console.log('Retry:', item.id)}
                    >
                      <Text className="text-sm font-semibold text-primary">Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-error/20 rounded-lg py-2 items-center"
                      onPress={() => handleDelete(item.id)}
                    >
                      <Text className="text-sm font-semibold text-error">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        {/* Clear All Button */}
        {history.length > 0 && (
          <View className="px-6 pb-6">
            <TouchableOpacity
              className="bg-error/20 rounded-lg py-3 items-center"
              onPress={handleClearAll}
            >
              <Text className="text-base font-semibold text-error">Clear All History</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
