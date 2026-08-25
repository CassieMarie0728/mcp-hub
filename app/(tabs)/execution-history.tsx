import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

type OutcomeFilter = 'all' | 'successful' | 'failed';
type OperationFilter = 'all' | 'discover' | 'execute' | 'test';

const PAGE_SIZE = 25;

function formatDuration(durationMs: number) {
  return durationMs < 1_000 ? `${durationMs} ms` : `${(durationMs / 1_000).toFixed(1)} s`;
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function operationLabel(operation: Exclude<OperationFilter, 'all'>) {
  return operation === 'discover' ? 'Discovery' : operation === 'execute' ? 'Tool run' : 'Connection test';
}

export default function ExecutionHistoryScreen() {
  const colors = useColors();
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [operation, setOperation] = useState<OperationFilter>('all');
  const [offset, setOffset] = useState(0);

  const historyQuery = trpc.analytics.getExecutionHistory.useQuery({
    success: outcome === 'all' ? undefined : outcome === 'successful',
    operation: operation === 'all' ? undefined : operation,
    limit: PAGE_SIZE,
    offset,
  });

  const setOutcomeFilter = (next: OutcomeFilter) => {
    setOffset(0);
    setOutcome(next);
  };

  const setOperationFilter = (next: OperationFilter) => {
    setOffset(0);
    setOperation(next);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">SECURE ACTIVITY LOG</Text>
          <Text className="text-4xl font-bold text-background mb-2">Execution History</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            Real events from your active workspace. No device-local shadow logs. No made-up victory laps.
          </Text>
        </View>

        <View className="flex-1 px-6 py-6 gap-6">
          <View className="bg-surface rounded-2xl border border-border p-4 gap-4">
            <View>
              <Text className="text-xs font-bold tracking-widest text-muted mb-2">OUTCOME</Text>
              <View className="flex-row gap-2">
                {(['all', 'successful', 'failed'] as OutcomeFilter[]).map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setOutcomeFilter(value)}
                    className={cn('flex-1 rounded-lg px-3 py-2 border', outcome === value ? 'bg-primary border-primary' : 'bg-background border-border')}
                  >
                    <Text className={cn('text-xs font-semibold text-center', outcome === value ? 'text-background' : 'text-foreground')}>
                      {value === 'all' ? 'All' : value === 'successful' ? 'Success' : 'Failed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold tracking-widest text-muted mb-2">ACTIVITY</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['all', 'discover', 'execute', 'test'] as OperationFilter[]).map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setOperationFilter(value)}
                    className={cn('rounded-lg px-3 py-2 border', operation === value ? 'bg-primary border-primary' : 'bg-background border-border')}
                  >
                    <Text className={cn('text-xs font-semibold', operation === value ? 'text-background' : 'text-foreground')}>
                      {value === 'all' ? 'Everything' : operationLabel(value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {historyQuery.isLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="text-sm text-muted mt-3">Loading your workspace activity…</Text>
            </View>
          ) : historyQuery.isError ? (
            <View className="bg-error/10 border border-error/30 rounded-2xl p-6 items-center">
              <MaterialIcons name="error-outline" size={34} color={colors.error} />
              <Text className="text-lg font-bold text-foreground text-center mt-3">History couldn’t load</Text>
              <Text className="text-sm text-muted text-center leading-relaxed mt-2">The activity log stays private when the protected read path is unavailable. Try again instead of trusting stale local data.</Text>
              <TouchableOpacity onPress={() => historyQuery.refetch()} className="bg-primary rounded-lg px-4 py-3 mt-4">
                <Text className="text-sm font-bold text-background">Retry protected query</Text>
              </TouchableOpacity>
            </View>
          ) : historyQuery.data?.items.length === 0 ? (
            <View className="bg-surface rounded-2xl border border-border p-8 items-center">
              <MaterialIcons name="history" size={42} color={colors.muted} />
              <Text className="text-lg font-bold text-foreground text-center mt-3">No matching activity yet</Text>
              <Text className="text-sm text-muted text-center leading-relaxed mt-2">When you test a registered server, discover tools, or run an authorized tool, its sanitized workspace record will appear here.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {historyQuery.data?.items.map((item) => (
                <View key={item.id} className="bg-surface rounded-2xl border border-border p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground">{item.toolName ?? operationLabel(item.operation)}</Text>
                      <Text className="text-sm text-muted mt-1">{item.serverName} · {operationLabel(item.operation)}</Text>
                    </View>
                    <View className={cn('rounded-full px-2.5 py-1', item.success ? 'bg-success/15' : 'bg-error/15')}>
                      <Text className={cn('text-xs font-bold', item.success ? 'text-success' : 'text-error')}>
                        {item.success ? 'SUCCESS' : 'FAILED'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mt-4 pt-3 border-t border-border">
                    <Text className="text-xs text-muted">{formatTimestamp(item.createdAt)}</Text>
                    <Text className="text-xs text-muted">{formatDuration(item.durationMs)}</Text>
                  </View>
                  {item.errorMessage ? <Text className="text-xs text-error leading-relaxed mt-3">{item.errorMessage}</Text> : null}
                </View>
              ))}

              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  disabled={offset === 0}
                  onPress={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                  className={cn('flex-1 rounded-lg py-3 border border-border', offset === 0 ? 'opacity-40 bg-surface' : 'bg-background')}
                >
                  <Text className="text-sm font-bold text-foreground text-center">Newer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!historyQuery.data?.hasMore}
                  onPress={() => setOffset((current) => current + PAGE_SIZE)}
                  className={cn('flex-1 rounded-lg py-3', historyQuery.data?.hasMore ? 'bg-primary' : 'bg-primary/40')}
                >
                  <Text className="text-sm font-bold text-background text-center">Older</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
