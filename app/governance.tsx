import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface AppEntry {
  id: string;
  packageName: string;
  appName: string;
  status: 'allowed' | 'blocked';
}

export default function GovernanceScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'allowed' | 'blocked'>('all');
  const [searchText, setSearchText] = useState('');

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
    loadApps();
  }, []);

  const loadApps = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from native bridge
      const mockApps: AppEntry[] = [
        {
          id: '1',
          packageName: 'com.google.android.apps.messaging',
          appName: 'Google Messages',
          status: 'allowed',
        },
        {
          id: '2',
          packageName: 'com.google.android.calendar',
          appName: 'Google Calendar',
          status: 'allowed',
        },
        {
          id: '3',
          packageName: 'com.facebook.katana',
          appName: 'Facebook',
          status: 'blocked',
        },
        {
          id: '4',
          packageName: 'com.twitter.android',
          appName: 'Twitter',
          status: 'blocked',
        },
      ];
      setApps(mockApps);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAppStatus = (id: string) => {
    setApps(
      apps.map((app) =>
        app.id === id
          ? { ...app, status: app.status === 'allowed' ? 'blocked' : 'allowed' }
          : app
      )
    );
  };

  const filteredApps = apps.filter((app) => {
    if (filter !== 'all' && app.status !== filter) return false;
    if (searchText && !app.appName.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    return true;
  });

  const renderAppEntry = ({ item }: { item: AppEntry }) => (
    <TouchableOpacity
      onPress={() => toggleAppStatus(item.id)}
      className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{item.appName}</Text>
        <Text className="text-xs text-muted mt-1">{item.packageName}</Text>
      </View>
      <View
        className={`px-3 py-1 rounded-full flex-row items-center gap-1 ${
          item.status === 'allowed'
            ? 'bg-success/20'
            : 'bg-error/20'
        }`}
      >
        <MaterialIcons
          name={item.status === 'allowed' ? 'check-circle' : 'block'}
          size={16}
          color={item.status === 'allowed' ? colors.success : colors.error}
        />
        <Text
          className={`text-xs font-semibold capitalize ${
            item.status === 'allowed' ? 'text-success' : 'text-error'
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
        <View className="flex-row items-center bg-background border border-border rounded-lg px-3 py-2">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 text-foreground ml-2"
            placeholder="Search apps..."
            placeholderTextColor={colors.muted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-surface border-b border-border px-4 py-3 flex-row gap-2">
        {(['all', 'allowed', 'blocked'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-full ${
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredApps.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="security" size={48} color={colors.muted} />
          <Text className="text-foreground font-semibold mt-4">No Apps Found</Text>
          <Text className="text-muted text-sm text-center mt-2">
            Tap an app to toggle between allowed and blocked
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4">
          <FlatList
            data={filteredApps}
            renderItem={renderAppEntry}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
          <View className="h-6" />
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
