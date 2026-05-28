import { ScrollView, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { adminMetricsManager, type SystemMetrics } from '@/server/admin/admin-metrics';

/**
 * Admin Dashboard Screen
 * Real-time system metrics, workflow execution stats, and health monitoring
 */

export default function AdminDashboardScreen() {
  const colors = useColors();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'errors'>('overview');

  useEffect(() => {
    loadMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminMetricsManager.getSystemMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!metrics) {
    return (
      <ScreenContainer className="flex items-center justify-center p-4">
        <Text className="text-foreground text-center">Failed to load metrics</Text>
        <Pressable
          onPress={loadMetrics}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="mt-4 bg-primary px-6 py-2 rounded-lg"
        >
          <Text className="text-background font-semibold">Retry</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 border-b border-border">
          <Text className="text-3xl font-bold text-foreground">Admin Dashboard</Text>
          <Text className="text-sm text-muted mt-1">System metrics and monitoring</Text>

          {/* Time Range Selector */}
          <View className="flex-row gap-2 mt-4">
            {(['hour', 'day', 'week', 'month'] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                style={({ pressed }) => [
                  {
                    backgroundColor: timeRange === range ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="px-3 py-1 rounded"
              >
                <Text
                  className={timeRange === range ? 'text-background font-semibold' : 'text-foreground'}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row border-b border-border">
          {(['overview', 'workflows', 'errors'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 border-b-2 ${
                activeTab === tab ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === tab ? 'text-primary' : 'text-muted'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View className="p-4 gap-4">
            {/* System Health */}
            <HealthCard health={metrics.systemHealth} colors={colors} />

            {/* Key Metrics */}
            <View className="gap-3">
              <MetricCard
                title="Workflow Executions"
                value={metrics.workflowMetrics.totalExecutions.toString()}
                subtitle={`${metrics.workflowMetrics.successfulExecutions} successful • ${metrics.workflowMetrics.failedExecutions} failed`}
                colors={colors}
              />
              <MetricCard
                title="Success Rate"
                value={`${metrics.workflowMetrics.successRate.toFixed(2)}%`}
                subtitle={`Avg duration: ${(metrics.workflowMetrics.averageDuration / 1000).toFixed(1)}s`}
                colors={colors}
              />
              <MetricCard
                title="Active Tokens"
                value={`${metrics.tokenMetrics.activeTokens}/${metrics.tokenMetrics.totalTokens}`}
                subtitle={`${metrics.tokenMetrics.expiringTokens} expiring soon`}
                colors={colors}
              />
              <MetricCard
                title="Active Users"
                value={metrics.userMetrics.activeUsers.toString()}
                subtitle={`${metrics.userMetrics.totalUsers} total • ${metrics.userMetrics.newUsersToday} new today`}
                colors={colors}
              />
            </View>

            {/* Token Distribution */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Tokens by Server</Text>
              {Object.entries(metrics.tokenMetrics.tokensByServer).map(([server, count]) => (
                <View key={server} className="flex-row items-center justify-between mb-2">
                  <Text className="text-foreground capitalize">{server}</Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${(count / metrics.tokenMetrics.totalTokens) * 100}%`,
                        backgroundColor: colors.primary,
                        minWidth: 20,
                      }}
                    />
                    <Text className="text-muted w-8 text-right">{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <View className="p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground mb-2">Workflow Metrics</Text>
            <MetricCard
              title="Total Executions"
              value={metrics.workflowMetrics.totalExecutions.toString()}
              subtitle={`${metrics.workflowMetrics.executionsPerMinute.toFixed(2)} per minute`}
              colors={colors}
            />
            <MetricCard
              title="Successful"
              value={metrics.workflowMetrics.successfulExecutions.toString()}
              subtitle={`${((metrics.workflowMetrics.successfulExecutions / metrics.workflowMetrics.totalExecutions) * 100).toFixed(1)}% of total`}
              colors={colors}
            />
            <MetricCard
              title="Failed"
              value={metrics.workflowMetrics.failedExecutions.toString()}
              subtitle={`${((metrics.workflowMetrics.failedExecutions / metrics.workflowMetrics.totalExecutions) * 100).toFixed(1)}% of total`}
              colors={colors}
            />
            <MetricCard
              title="Average Duration"
              value={`${(metrics.workflowMetrics.averageDuration / 1000).toFixed(2)}s`}
              subtitle="Time to complete"
              colors={colors}
            />

            {/* Workspace Stats */}
            <View className="bg-surface rounded-lg p-4 border border-border mt-2">
              <Text className="text-lg font-semibold text-foreground mb-3">Workspace Activity</Text>
              <MetricRow
                label="Total Workspaces"
                value={metrics.workspaceMetrics.totalWorkspaces.toString()}
                colors={colors}
              />
              <MetricRow
                label="Active Workspaces"
                value={metrics.workspaceMetrics.activeWorkspaces.toString()}
                colors={colors}
              />
              <MetricRow
                label="With Errors"
                value={metrics.workspaceMetrics.workspacesWithErrors.toString()}
                colors={colors}
              />
            </View>
          </View>
        )}

        {/* Errors Tab */}
        {activeTab === 'errors' && (
          <View className="p-4 gap-3">
            <Text className="text-lg font-semibold text-foreground mb-2">Error Metrics</Text>
            <MetricCard
              title="Total Errors"
              value={metrics.errorMetrics.totalErrors.toString()}
              subtitle={`${metrics.errorMetrics.errorRate.toFixed(2)}% error rate`}
              colors={colors}
            />

            {/* Top Errors */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Top Errors</Text>
              {metrics.errorMetrics.topErrors.map((error, index) => (
                <View key={index} className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground capitalize font-semibold">{error.type}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-2 rounded-full bg-error"
                      style={{
                        width: `${(error.count / metrics.errorMetrics.totalErrors) * 100}%`,
                        minWidth: 20,
                      }}
                    />
                    <Text className="text-muted w-8 text-right">{error.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Error Trend */}
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">Error Trend (Last 24h)</Text>
              {metrics.errorMetrics.errorTrend.map((trend, index) => (
                <View key={index} className="flex-row items-center justify-between mb-2">
                  <Text className="text-muted text-xs w-24">
                    {new Date(trend.timestamp).toLocaleTimeString()}
                  </Text>
                  <View
                    className="h-6 rounded bg-error"
                    style={{
                      width: Math.max(20, (trend.count / 10) * 100),
                      opacity: 0.7,
                    }}
                  />
                  <Text className="text-foreground w-8 text-right">{trend.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View className="p-4 border-t border-border mt-4">
          <Text className="text-xs text-muted text-center">
            Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
          </Text>
          <Pressable
            onPress={loadMetrics}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="mt-3 bg-primary px-4 py-2 rounded-lg"
          >
            <Text className="text-background font-semibold text-center">Refresh</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ============================================================================
// Components
// ============================================================================

interface HealthCardProps {
  health: any;
  colors: any;
}

function HealthCard({ health, colors }: HealthCardProps) {
  const statusColor =
    health.status === 'healthy' ? colors.success : health.status === 'degraded' ? colors.warning : colors.error;

  return (
    <View className="bg-surface rounded-lg p-4 border border-border">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-foreground">System Health</Text>
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
          <Text className="text-foreground font-semibold capitalize">{health.status}</Text>
        </View>
      </View>

      <View className="gap-2">
        <HealthRow label="Database" connected={health.databaseConnected} colors={colors} />
        <HealthRow label="Cache" connected={health.cacheConnected} colors={colors} />
        <HealthRow
          label={`Memory: ${health.memoryUsage}%`}
          connected={health.memoryUsage < 80}
          colors={colors}
        />
        <HealthRow label={`API Response: ${health.apiResponseTime}ms`} connected={true} colors={colors} />
      </View>
    </View>
  );
}

interface HealthRowProps {
  label: string;
  connected: boolean;
  colors: any;
}

function HealthRow({ label, connected, colors }: HealthRowProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-foreground">{label}</Text>
      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: connected ? colors.success : colors.error }} />
    </View>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  colors: any;
}

function MetricCard({ title, value, subtitle, colors }: MetricCardProps) {
  return (
    <View className="bg-surface rounded-lg p-4 border border-border">
      <Text className="text-sm text-muted mb-1">{title}</Text>
      <Text className="text-3xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted mt-2">{subtitle}</Text>
    </View>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  colors: any;
}

function MetricRow({ label, value, colors }: MetricRowProps) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-border">
      <Text className="text-foreground">{label}</Text>
      <Text className="text-foreground font-semibold">{value}</Text>
    </View>
  );
}
