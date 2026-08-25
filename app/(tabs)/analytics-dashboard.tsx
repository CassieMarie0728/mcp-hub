import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

type Range = '7d' | '30d';

function formatDuration(durationMs: number) {
  return durationMs < 1_000 ? `${durationMs} ms` : `${(durationMs / 1_000).toFixed(1)} s`;
}

function operationLabel(operation: 'discover' | 'execute' | 'test') {
  return operation === 'discover' ? 'Discovery' : operation === 'execute' ? 'Tool run' : 'Connection test';
}

export default function AnalyticsDashboardScreen() {
  const colors = useColors();
  const [range, setRange] = useState<Range>('7d');
  const reportQuery = trpc.analytics.getReport.useQuery({ range });
  const report = reportQuery.data;

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">REAL ACTIVITY ONLY</Text>
          <Text className="text-4xl font-bold text-background mb-2">Workspace Analytics</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            These numbers come from authorized MCP operations recorded in your workspace. If there’s no activity, you get the truth—not dashboard cosplay.
          </Text>
        </View>

        <View className="flex-1 px-6 py-6 gap-6">
          <View className="flex-row bg-surface rounded-xl border border-border p-1 gap-1">
            {(['7d', '30d'] as Range[]).map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setRange(value)}
                className={cn('flex-1 rounded-lg py-3', range === value ? 'bg-primary' : 'bg-transparent')}
              >
                <Text className={cn('text-sm font-bold text-center', range === value ? 'text-background' : 'text-foreground')}>
                  Last {value === '7d' ? '7 days' : '30 days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {reportQuery.isLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="text-sm text-muted mt-3">Counting real workspace events…</Text>
            </View>
          ) : reportQuery.isError ? (
            <View className="bg-error/10 border border-error/30 rounded-2xl p-6 items-center">
              <MaterialIcons name="error-outline" size={34} color={colors.error} />
              <Text className="text-lg font-bold text-foreground text-center mt-3">Analytics couldn’t load</Text>
              <Text className="text-sm text-muted text-center leading-relaxed mt-2">No stale cache gets dressed up as telemetry. Retry the protected report when the service is available.</Text>
              <TouchableOpacity onPress={() => reportQuery.refetch()} className="bg-primary rounded-lg px-4 py-3 mt-4">
                <Text className="text-sm font-bold text-background">Retry protected report</Text>
              </TouchableOpacity>
            </View>
          ) : report ? (
            <>
              <View className="flex-row flex-wrap gap-3">
                <MetricCard label="Operations" value={String(report.totals.totalExecutions)} icon="bolt" color={colors.primary} />
                <MetricCard label="Success rate" value={`${report.totals.successRate}%`} icon="verified" color={colors.success} />
                <MetricCard label="Avg. duration" value={formatDuration(report.totals.averageDurationMs)} icon="timer" color={colors.warning} />
                <MetricCard label="Failures" value={String(report.totals.failedExecutions)} icon="report-problem" color={colors.error} />
              </View>

              {report.totals.totalExecutions === 0 ? (
                <View className="bg-surface rounded-2xl border border-border p-8 items-center">
                  <MaterialIcons name="query-stats" size={42} color={colors.muted} />
                  <Text className="text-lg font-bold text-foreground text-center mt-3">No verified activity in this window</Text>
                  <Text className="text-sm text-muted text-center leading-relaxed mt-2">Run an authorized connection test, discovery, or tool action. When the runtime writes a workspace log, the math appears here.</Text>
                </View>
              ) : (
                <>
                  <AnalyticsSection title="Activity by operation" empty="No operation data yet">
                    {report.byOperation.map((item) => (
                      <AnalyticsRow
                        key={item.operation}
                        label={operationLabel(item.operation)}
                        detail={`${item.successfulExecutions}/${item.totalExecutions} successful · ${formatDuration(item.averageDurationMs)} avg.`}
                        value={`${item.totalExecutions}`}
                      />
                    ))}
                  </AnalyticsSection>

                  <AnalyticsSection title="Top tools" empty="No tool executions in this window">
                    {report.topTools.map((item) => (
                      <AnalyticsRow
                        key={item.toolName}
                        label={item.toolName}
                        detail={`${item.successRate}% success`}
                        value={`${item.totalExecutions}`}
                      />
                    ))}
                  </AnalyticsSection>

                  <AnalyticsSection title="Active servers" empty="No active servers in this window">
                    {report.activeServers.map((item) => (
                      <AnalyticsRow
                        key={item.serverId}
                        label={item.serverName}
                        detail={`${item.successRate}% success · ${formatDuration(item.averageDurationMs)} avg.`}
                        value={`${item.totalExecutions}`}
                      />
                    ))}
                  </AnalyticsSection>
                </>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }) {
  return (
    <View className="w-[47%] flex-grow bg-surface rounded-2xl border border-border p-4">
      <MaterialIcons name={icon} size={22} color={color} />
      <Text className="text-2xl font-bold text-foreground mt-3" numberOfLines={1}>{value}</Text>
      <Text className="text-xs text-muted mt-1">{label}</Text>
    </View>
  );
}

function AnalyticsSection({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <View className="bg-surface rounded-2xl border border-border p-5">
      <Text className="text-base font-bold text-foreground mb-3">{title}</Text>
      {items.length > 0 ? <View className="gap-3">{children}</View> : <Text className="text-sm text-muted">{empty}</Text>}
    </View>
  );
}

function AnalyticsRow({ label, detail, value }: { label: string; detail: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>{label}</Text>
        <Text className="text-xs text-muted mt-1" numberOfLines={1}>{detail}</Text>
      </View>
      <Text className="text-lg font-bold text-primary">{value}</Text>
    </View>
  );
}
