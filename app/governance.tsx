import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type GovernanceSettings } from '@/hooks/use-mcp-bridge-extended';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'allowed' | 'blocked'>('allowed');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Governance',
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
          <MaterialIcons name="security" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

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
        `App ${newStatus === 'allowed' ? 'allowed' : 'blocked'}`
      );
    } catch (error) {
      console.error('Failed to update app status:', error);
      Alert.alert('Error', 'Failed to update app status');
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = app.appName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab = app.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const renderAppItem = ({ item }: { item: AppItem }) => (
    <TouchableOpacity
      onPress={() => handleToggleApp(item.packageName, item.status)}
      className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between active:opacity-70"
    >
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{item.appName}</Text>
        <Text className="text-xs text-muted mt-1">{item.packageName}</Text>
      </View>
      <View
        className={`px-3 py-1 rounded-full ${
          item.status === 'allowed'
            ? 'bg-success/20'
            : 'bg-error/20'
        }`}
      >
        <Text
          className={`text-xs font-semibold capitalize ${
            item.status === 'allowed'
              ? 'text-success'
              : 'text-error'
          }`}
        >
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Search Bar */}
      <View className="bg-surface border-b border-border px-4 py-3">
        <View className="flex-row items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground"
            placeholder="Search apps..."
            placeholderTextColor={colors.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Tab Bar */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row gap-2">
        {(['allowed', 'blocked'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab
                ? 'bg-primary'
                : 'bg-background border border-border'
            }`}
          >
            <Text
              className={`text-sm font-semibold capitalize ${
                activeTab === tab ? 'text-background' : 'text-foreground'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredApps.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="security" size={48} color={colors.muted} />
          <Text className="text-foreground font-semibold mt-4">No Apps</Text>
          <Text className="text-muted text-sm text-center mt-2">
            {searchTerm
              ? 'No apps match your search'
              : `No ${activeTab} apps`}
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <FlatList
            data={filteredApps}
            renderItem={renderAppItem}
            keyExtractor={(item) => item.packageName}
            scrollEnabled={false}
          />
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Info Box */}
      <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mx-4 mb-6">
        <View className="flex-row gap-2">
          <MaterialIcons name="info" size={16} color={colors.primary} />
          <Text className="text-xs text-muted flex-1">
            Tap an app to toggle between allowed and blocked. Blocked apps cannot access MCP
            tools.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
