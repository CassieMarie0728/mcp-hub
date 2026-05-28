import { ScrollView, Text, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type AuditLogEntry } from '@/hooks/use-mcp-bridge-extended';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/skeleton';

export default function AuditLogScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { getAuditLog } = useMCPBridgeExtended();
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [searchText, setSearchText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAuditLog();
    setRefreshing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const filteredLog = auditLog.filter(
    (entry) =>
      entry.toolName.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.userId?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const successCount = auditLog.filter((e) => e.status === 'success').length;
  const errorCount = auditLog.filter((e) => e.status === 'error').length;

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-6 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-4xl font-bold text-background">Audit Log</Text>
            <Text className="text-sm text-background/80 mt-2">Track all tool executions</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={28} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        <View className="flex-row gap-3 mb-6">
          <Card variant="elevated" className="flex-1">
            <View className="items-center gap-2">
              <View className="w-10 h-10 rounded-lg bg-success/10 items-center justify-center">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
              <Text className="text-2xl font-bold text-foreground">{successCount}</Text>
              <Text className="text-xs text-muted">Successful</Text>
            </View>
          </Card>

          <Card variant="elevated" className="flex-1">
            <View className="items-center gap-2">
              <View className="w-10 h-10 rounded-lg bg-error/10 items-center justify-center">
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </View>
              <Text className="text-2xl font-bold text-foreground">{errorCount}</Text>
              <Text className="text-xs text-muted">Errors</Text>
            </View>
          </Card>
        </View>

        {/* Search & Filter */}
        <Card variant="outlined" className="mb-6">
          <CardContent className="gap-3">
            <Input
              variant="search"
              placeholder="Search by tool or user..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <View className="flex-row gap-2">
              {(['all', 'success', 'error'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`flex-1 py-2 px-3 rounded-lg border ${
                    filter === f ? 'bg-primary border-primary' : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold text-center ${
                      filter === f ? 'text-background' : 'text-foreground'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'success' ? '✓ Success' : '✗ Error'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* Audit Log List */}
        {isLoading ? (
          <View className="gap-3 pb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} variant="elevated">
                <View className="gap-3">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-2">
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="40%" height={12} />
                    </View>
                    <Skeleton width={60} height={24} borderRadius={12} />
                  </View>
                  <View className="gap-2 pt-2 border-t border-border">
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="70%" height={14} />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : filteredLog.length === 0 ? (
          <Card variant="outlined" className="items-center py-12">
            <Ionicons name="document-text-outline" size={40} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-3 mb-1">No Entries</Text>
            <Text className="text-sm text-muted text-center">
              No audit log entries match your filter
            </Text>
          </Card>
        ) : (
          <View className="gap-3 pb-8">
            {filteredLog.map((entry, idx) => (
              <Card key={idx} variant="elevated">
                <View className="gap-3">
                  {/* Header */}
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">{entry.toolName}</Text>
                      <Text className="text-xs text-muted mt-1">
                        {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                      </Text>
                    </View>
                    <Badge
                      variant="status"
                      color={entry.status === 'success' ? 'success' : 'error'}
                    >
                      {entry.status === 'success' ? 'Success' : 'Error'}
                    </Badge>
                  </View>

                  {/* Details */}
                  <View className="gap-2 pt-2 border-t border-border">
                    {entry.userId && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="person" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted flex-1">{entry.userId}</Text>
                      </View>
                    )}

                    {entry.duration && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="timer" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted">{entry.duration}ms</Text>
                      </View>
                    )}

                    {entry.error && (
                      <View className="bg-error/10 rounded-lg p-3 mt-2">
                        <Text className="text-xs font-semibold text-error mb-1">Error:</Text>
                        <Text className="text-xs text-error">{entry.error}</Text>
                      </View>
                    )}

                    {entry.result ? (
                      <View className="bg-success/10 rounded-lg p-3 mt-2">
                        <Text className="text-xs font-semibold text-success mb-1">Result:</Text>
                        <Text className="text-xs text-success" numberOfLines={2}>
                          {typeof entry.result === 'string'
                            ? entry.result
                            : JSON.stringify(entry.result).substring(0, 100)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
