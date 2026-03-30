import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type GovernanceSettings } from '@/hooks/use-mcp-bridge-extended';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AppItem {
  packageName: string;
  appName: string;
  status: 'allowed' | 'blocked';
}

export default function GovernanceScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { getGovernanceSettings, updateAppStatus } = useMCPBridgeExtended();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'allowed' | 'blocked'>('allowed');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    loadGovernanceSettings();
  }, [getGovernanceSettings]);

  const loadGovernanceSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getGovernanceSettings();
      const allApps: AppItem[] = [
        ...settings.allowlist.map((app) => ({
          ...app,
          status: 'allowed' as const,
        })),
        ...settings.blocklist.map((app) => ({
          ...app,
          status: 'blocked' as const,
        })),
      ];
      setApps(allApps);
    } catch (error) {
      console.error('Failed to load governance settings:', error);
      Alert.alert('Error', 'Failed to load governance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGovernanceSettings();
    setRefreshing(false);
  };

  const handleToggleApp = async (packageName: string, currentStatus: 'allowed' | 'blocked') => {
    const newStatus = currentStatus === 'allowed' ? 'blocked' : 'allowed';

    try {
      await updateAppStatus(packageName, newStatus);

      setApps((prevApps) =>
        prevApps.map((app) =>
          app.packageName === packageName ? { ...app, status: newStatus } : app
        )
      );

      Alert.alert(
        'Success',
        `App ${newStatus === 'allowed' ? 'allowed' : 'blocked'} successfully`
      );
    } catch (error) {
      console.error('Failed to update app status:', error);
      Alert.alert('Error', 'Failed to update app status');
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.status === activeTab &&
      app.appName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allowedCount = apps.filter((a) => a.status === 'allowed').length;
  const blockedCount = apps.filter((a) => a.status === 'blocked').length;

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-6 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-4xl font-bold text-background">Governance</Text>
            <Text className="text-sm text-background/80 mt-2">Control app access & permissions</Text>
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
              <Text className="text-2xl font-bold text-foreground">{allowedCount}</Text>
              <Text className="text-xs text-muted">Allowed</Text>
            </View>
          </Card>

          <Card variant="elevated" className="flex-1">
            <View className="items-center gap-2">
              <View className="w-10 h-10 rounded-lg bg-error/10 items-center justify-center">
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </View>
              <Text className="text-2xl font-bold text-foreground">{blockedCount}</Text>
              <Text className="text-xs text-muted">Blocked</Text>
            </View>
          </Card>
        </View>

        {/* Search */}
        <Card variant="outlined" className="mb-6">
          <CardContent>
            <Input
              variant="search"
              placeholder="Search apps..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-6">
          {(['allowed', 'blocked'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg border ${
                activeTab === tab
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  activeTab === tab ? 'text-background' : 'text-foreground'
                }`}
              >
                {tab === 'allowed' ? '✓ Allowed' : '✗ Blocked'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Apps List */}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="hourglass" size={40} color={colors.muted} />
            <Text className="text-muted mt-3">Loading apps...</Text>
          </View>
        ) : filteredApps.length === 0 ? (
          <Card variant="outlined" className="items-center py-12">
            <Ionicons name="apps-outline" size={40} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-3 mb-1">No Apps</Text>
            <Text className="text-sm text-muted text-center">
              No {activeTab} apps match your search
            </Text>
          </Card>
        ) : (
          <View className="gap-3 pb-8">
            {filteredApps.map((app) => (
              <Card key={app.packageName} variant="elevated">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold text-foreground">{app.appName}</Text>
                    <Text className="text-xs text-muted">{app.packageName}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleToggleApp(app.packageName, app.status)}
                    className={`w-12 h-12 rounded-lg items-center justify-center ${
                      app.status === 'allowed'
                        ? 'bg-success/20'
                        : 'bg-error/20'
                    }`}
                  >
                    <Ionicons
                      name={app.status === 'allowed' ? 'checkmark' : 'close'}
                      size={24}
                      color={app.status === 'allowed' ? colors.success : colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
