/**
 * Analytics Dashboard Screen
 * Real-time execution metrics, trends, and performance analysis
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface ToolStats {
  toolName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}

interface ServerStats {
  serverId: string;
  serverType: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}

interface AnalyticsSummary {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  topTools: ToolStats[];
  serverStats: ServerStats[];
}

export default function AnalyticsDashboardScreen() {
  const colors = useColors();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'servers'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // TODO: Call tRPC generateReport with date range
      // Mock data for now
      setAnalytics({
        totalExecutions: 1247,
        successfulExecutions: 1189,
        failedExecutions: 58,
        averageExecutionTime: 245,
        successRate: 95.3,
        topTools: [
          {
            toolName: 'create_issue',
            totalExecutions: 342,
            successfulExecutions: 328,
            failedExecutions: 14,
            averageExecutionTime: 180,
            successRate: 95.9,
          },
          {
            toolName: 'send_message',
            totalExecutions: 289,
            successfulExecutions: 285,
            failedExecutions: 4,
            averageExecutionTime: 120,
            successRate: 98.6,
          },
          {
            toolName: 'create_page',
            totalExecutions: 156,
            successfulExecutions: 142,
            failedExecutions: 14,
            averageExecutionTime: 350,
            successRate: 91.0,
          },
        ],
        serverStats: [
          {
            serverId: 'github-1',
            serverType: 'github',
            totalExecutions: 342,
            successfulExecutions: 328,
            failedExecutions: 14,
            averageExecutionTime: 180,
            successRate: 95.9,
          },
          {
            serverId: 'slack-1',
            serverType: 'slack',
            totalExecutions: 289,
            successfulExecutions: 285,
            failedExecutions: 4,
            averageExecutionTime: 120,
            successRate: 98.6,
          },
          {
            serverId: 'notion-1',
            serverType: 'notion',
            totalExecutions: 156,
            successfulExecutions: 142,
            failedExecutions: 14,
            averageExecutionTime: 350,
            successRate: 91.0,
          },
        ],
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    unit,
    icon,
    color,
  }: {
    label: string;
    value: number | string;
    unit?: string;
    icon: string;
    color: string;
  }) => (
    <View className="bg-surface rounded-lg p-4 border border-border flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-xs font-semibold">{label}</Text>
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <MaterialIcons name={icon as any} size={16} color={color} />
        </View>
      </View>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-foreground font-bold text-2xl">{value}</Text>
        {unit && <Text className="text-muted text-sm">{unit}</Text>}
      </View>
    </View>
  );

  const ToolRow = ({ tool }: { tool: ToolStats }) => (
    <View className="bg-surface rounded-lg p-4 border border-border mb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-foreground font-semibold flex-1">{tool.toolName}</Text>
        <View className="bg-success/10 rounded px-2 py-1">
          <Text className="text-success text-xs font-semibold">{tool.successRate.toFixed(1)}%</Text>
        </View>
      </View>

      <View className="gap-1 mb-2">
        <View className="flex-row justify-between">
          <Text className="text-muted text-xs">Executions: {tool.totalExecutions}</Text>
          <Text className="text-muted text-xs">Avg Time: {tool.averageExecutionTime}ms</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-success text-xs">✓ {tool.successfulExecutions}</Text>
          <Text className="text-error text-xs">✗ {tool.failedExecutions}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="h-2 bg-background rounded-full overflow-hidden">
        <View
          className="h-full bg-success"
          style={{ width: `${tool.successRate}%` }}
        />
      </View>
    </View>
  );

  const ServerRow = ({ server }: { server: ServerStats }) => {
    const serverIcons: Record<string, string> = {
      github: 'code',
      slack: 'chat',
      notion: 'storage',
    };

    const serverColors: Record<string, string> = {
      github: '#333333',
      slack: '#E01E5A',
      notion: '#000000',
    };

    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-2">
        <View className="flex-row items-center gap-3 mb-2">
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: serverColors[server.serverType] + '20' }}
          >
            <MaterialIcons
              name={serverIcons[server.serverType] as any}
              size={16}
              color={serverColors[server.serverType]}
            />
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold capitalize">
              {server.serverType}
            </Text>
            <Text className="text-muted text-xs">{server.totalExecutions} executions</Text>
          </View>
          <View className="bg-success/10 rounded px-2 py-1">
            <Text className="text-success text-xs font-semibold">{server.successRate.toFixed(1)}%</Text>
          </View>
        </View>

        <View className="gap-1">
          <View className="flex-row justify-between">
            <Text className="text-muted text-xs">Avg Time: {server.averageExecutionTime}ms</Text>
            <Text className="text-success text-xs">✓ {server.successfulExecutions}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Time Range Selector */}
      <View className="flex-row gap-2 mb-4">
        {(['24h', '7d', '30d'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            onPress={() => setTimeRange(range)}
            className={cn(
              'flex-1 py-2 rounded border',
              timeRange === range
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            )}
          >
            <Text
              className={cn(
                'text-center font-semibold text-sm',
                timeRange === range ? 'text-background' : 'text-foreground'
              )}
            >
              {range === '24h' ? '24h' : range === '7d' ? '7 days' : '30 days'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Navigation */}
      <View className="flex-row border-b border-border mb-4">
        {(['overview', 'tools', 'servers'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 px-4 border-b-2',
              activeTab === tab ? 'border-primary' : 'border-transparent'
            )}
          >
            <Text
              className={cn(
                'text-center font-semibold text-sm',
                activeTab === tab ? 'text-primary' : 'text-muted'
              )}
            >
              {tab === 'overview' ? 'Overview' : tab === 'tools' ? 'Tools' : 'Servers'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : analytics ? (
          <>
            {activeTab === 'overview' && (
              <View className="gap-4">
                {/* Summary Stats */}
                <View className="gap-3">
                  <View className="flex-row gap-2">
                    <StatCard
                      label="Total Executions"
                      value={analytics.totalExecutions}
                      icon="play-circle"
                      color={colors.primary}
                    />
                    <StatCard
                      label="Success Rate"
                      value={analytics.successRate.toFixed(1)}
                      unit="%"
                      icon="check-circle"
                      color="#22C55E"
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <StatCard
                      label="Successful"
                      value={analytics.successfulExecutions}
                      icon="thumb-up"
                      color="#22C55E"
                    />
                    <StatCard
                      label="Failed"
                      value={analytics.failedExecutions}
                      icon="error"
                      color="#EF4444"
                    />
                  </View>

                  <StatCard
                    label="Avg Execution Time"
                    value={analytics.averageExecutionTime}
                    unit="ms"
                    icon="speed"
                    color="#F59E0B"
                  />
                </View>

                {/* Top Tools */}
                <View className="mt-4">
                  <Text className="text-foreground font-bold text-lg mb-3">Top Tools</Text>
                  {analytics.topTools.map((tool) => (
                    <ToolRow key={tool.toolName} tool={tool} />
                  ))}
                </View>

                {/* Server Performance */}
                <View className="mt-4">
                  <Text className="text-foreground font-bold text-lg mb-3">Server Performance</Text>
                  {analytics.serverStats.map((server) => (
                    <ServerRow key={server.serverId} server={server} />
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'tools' && (
              <View className="gap-3">
                <Text className="text-foreground font-semibold text-lg mb-2">Tool Performance</Text>
                {analytics.topTools.map((tool) => (
                  <ToolRow key={tool.toolName} tool={tool} />
                ))}
              </View>
            )}

            {activeTab === 'servers' && (
              <View className="gap-3">
                <Text className="text-foreground font-semibold text-lg mb-2">Server Statistics</Text>
                {analytics.serverStats.map((server) => (
                  <ServerRow key={server.serverId} server={server} />
                ))}
              </View>
            )}

            {/* Export Button */}
            <TouchableOpacity className="mt-6 bg-primary/10 rounded-lg py-3 items-center border border-primary">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="download" size={20} color={colors.primary} />
                <Text className="text-primary font-semibold">Export Analytics</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons name="info" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4">No Data Available</Text>
            <Text className="text-muted text-center mt-2 px-4">
              Execute some macros to see analytics
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
