import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, clearExecutionHistory } = useApp();
  const colorScheme = useColorScheme();
  const colors = useColors();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all execution history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearExecutionHistory();
            Alert.alert('Success', 'Execution history cleared');
          },
        },
      ]
    );
  };

  const handleThemeChange = (value: boolean) => {
    setIsDarkMode(value);
    updateSettings({ theme: value ? 'dark' : 'light' });
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6">
        <Text className="text-3xl font-bold text-background">Settings</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Appearance Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Appearance</Text>
          <View className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="dark-mode" size={20} color={colors.primary} />
              <Text className="text-foreground font-medium">Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleThemeChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Execution Settings */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Execution</Text>
          <View className="bg-surface rounded-xl p-4 border border-border mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-foreground font-medium">Enable Timeout</Text>
                <Text className="text-xs text-muted mt-1">Limit tool execution time</Text>
              </View>
              <Switch
                value={settings.executionTimeoutEnabled}
                onValueChange={(value) =>
                  updateSettings({ executionTimeoutEnabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>
          {settings.executionTimeoutEnabled && (
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-foreground font-medium">Timeout Duration</Text>
                  <Text className="text-xs text-muted mt-1">
                    {settings.executionTimeout / 1000}s
                  </Text>
                </View>
                <Text className="text-sm text-primary font-medium">
                  {settings.executionTimeout / 1000}s
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Dashboard Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Dashboard</Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push('/audit-log' as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="history" size={20} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Audit Log</Text>
                  <Text className="text-xs text-muted mt-1">View tool execution history</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/governance' as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="security" size={20} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Governance</Text>
                  <Text className="text-xs text-muted mt-1">Manage app allowlist/blacklist</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/service-control' as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="cloud-done" size={20} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Service Control</Text>
                  <Text className="text-xs text-muted mt-1">Start/stop MCP server</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/perception-test' as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="visibility" size={20} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Perception Test</Text>
                  <Text className="text-xs text-muted mt-1">Test AI perception engine</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/macro-management' as any)}
              className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="build" size={20} color={colors.primary} />
                <View>
                  <Text className="text-foreground font-medium">Macro Management</Text>
                  <Text className="text-xs text-muted mt-1">Create and manage macros</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Notifications</Text>
          <TouchableOpacity
            onPress={() => router.push('/notification-settings' as any)}
            className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="notifications" size={20} color={colors.primary} />
              <View>
                <Text className="text-foreground font-medium">Notification Settings</Text>
                <Text className="text-xs text-muted mt-1">Manage alert preferences</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Data Management</Text>
          <TouchableOpacity
            onPress={handleClearHistory}
            className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
              <View>
                <Text className="text-foreground font-medium">Clear History</Text>
                <Text className="text-xs text-muted mt-1">Delete all execution history</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View className="mb-12">
          <Text className="text-lg font-semibold text-foreground mb-4">About</Text>
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="mb-4">
              <Text className="text-xs text-muted mb-1">App Name</Text>
              <Text className="text-foreground font-medium">MCP Hub</Text>
            </View>
            <View className="mb-4">
              <Text className="text-xs text-muted mb-1">Version</Text>
              <Text className="text-foreground font-medium">1.0.0</Text>
            </View>
            <View>
              <Text className="text-xs text-muted mb-1">Description</Text>
              <Text className="text-sm text-muted">
                Unified hub for connecting and managing multiple MCP servers
              </Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View className="bg-primary/10 rounded-xl p-4 border border-primary/20 mb-12">
          <View className="flex-row gap-3">
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold mb-1">About MCP</Text>
              <Text className="text-xs text-muted leading-relaxed">
                The Model Context Protocol enables seamless integration between AI applications
                and external data sources and tools. MCP Hub provides a unified interface to
                manage and interact with multiple MCP servers.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
