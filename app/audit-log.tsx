import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type AuditLogEntry } from '@/hooks/use-mcp-bridge-extended';

export default function AuditLogScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { getAuditLog } = useMCPBridgeExtended();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Audit Log',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
      },
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <MaterialIcons name="history" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  useEffect(() => {
    loadAuditLog();
  }, [filter, getAuditLog]);

  const loadAuditLog = async () => {
    setIsLoading(true);
    try {
      const log = await getAuditLog(filter, 100);
      setAuditLog(log);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAuditLog();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const renderAuditEntry = ({ item }: { item: AuditLogEntry }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-start gap-3">
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: getStatusColor(item.status) + '20' }}
      >
        <MaterialIcons
          name={
            item.status === 'success'
              ? 'check-circle'
              : item.status === 'error'
                ? 'error'
                : 'schedule'
          }
          size={20}
          color={getStatusColor(item.status)}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-foreground font-semibold">{item.toolName}</Text>
          <Text className="text-xs text-muted">{formatTime(item.timestamp)}</Text>
        </View>
        <Text className="text-xs text-muted mb-1">{item.serverName}</Text>
        {item.duration && (
          <Text className="text-xs text-muted">Duration: {item.duration}ms</Text>
        )}
        {item.message && <Text className="text-xs text-error mt-1">{item.message}</Text>}
      </View>
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Filter Tabs and Refresh */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row gap-2 flex-1">
          {(['all', 'success', 'error'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-3 py-1 rounded-full ${
                filter === f
                  ? 'bg-primary'
                  : 'bg-background border border-border'
              }`}
            >
              <Text
                className={`text-xs font-semibold capitalize ${
                  filter === f ? 'text-background' : 'text-foreground'
                }`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleRefresh} className="p-2">
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : auditLog.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="history" size={48} color={colors.muted} />
          <Text className="text-foreground font-semibold mt-4">No Audit Entries</Text>
          <Text className="text-muted text-sm text-center mt-2">
            Tool executions will appear here
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <FlatList
            data={auditLog}
            renderItem={renderAuditEntry}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
          <View className="h-6" />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
