import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { usePushNotifications, type NotificationPreferences } from '@/hooks/use-push-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_STORAGE_KEY = 'notification_preferences';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { preferences, updatePreferences, sendTestNotification } = usePushNotifications();
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Notification Settings',
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
          <MaterialIcons name="notifications" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLocalPrefs(parsed);
        updatePreferences(parsed);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...localPrefs,
      [key]: !localPrefs[key],
    };
    setLocalPrefs(updated);
    updatePreferences(updated);

    try {
      await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent');
    } catch (error: any) {
      Alert.alert('Error', `Failed to send test notification: ${error.message}`);
    }
  };

  const ToggleOption = ({
    label,
    description,
    value,
    onToggle,
    icon,
  }: {
    label: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    icon: string;
  }) => (
    <View className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3 flex-1">
        <MaterialIcons name={icon as any} size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{label}</Text>
          <Text className="text-xs text-muted mt-1">{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.muted}
      />
    </View>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Tool Execution Alerts Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4 flex-row items-center gap-2">
            <MaterialIcons name="build" size={20} color={colors.primary} /> Tool Execution
          </Text>

          <ToggleOption
            label="Tool Execution Alerts"
            description="Notify when tools start executing"
            value={localPrefs.toolExecutionAlerts}
            onToggle={() => handleToggle('toolExecutionAlerts')}
            icon="play-circle"
          />

          <ToggleOption
            label="Success Notifications"
            description="Notify when tools complete successfully"
            value={localPrefs.toolSuccessNotifications}
            onToggle={() => handleToggle('toolSuccessNotifications')}
            icon="check-circle"
          />

          <ToggleOption
            label="Error Notifications"
            description="Notify when tool execution fails"
            value={localPrefs.toolErrorNotifications}
            onToggle={() => handleToggle('toolErrorNotifications')}
            icon="error"
          />
        </View>

        {/* Service Status Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4 flex-row items-center gap-2">
            <MaterialIcons name="cloud" size={20} color={colors.primary} /> Service Status
          </Text>

          <ToggleOption
            label="Service Status Alerts"
            description="Notify when MCP server starts or stops"
            value={localPrefs.serviceStatusAlerts}
            onToggle={() => handleToggle('serviceStatusAlerts')}
            icon="cloud-done"
          />
        </View>

        {/* Audit Log Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4 flex-row items-center gap-2">
            <MaterialIcons name="history" size={20} color={colors.primary} /> Audit Log
          </Text>

          <ToggleOption
            label="Audit Log Notifications"
            description="Notify for important audit log events"
            value={localPrefs.auditLogNotifications}
            onToggle={() => handleToggle('auditLogNotifications')}
            icon="history"
          />
        </View>

        {/* Test Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">Test Notifications</Text>

          <TouchableOpacity
            onPress={handleTestNotification}
            className="bg-primary rounded-lg py-4 items-center justify-center flex-row gap-2"
          >
            <MaterialIcons name="send" size={20} color={colors.background} />
            <Text className="text-background font-semibold">Send Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
          <View className="flex-row gap-2">
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text className="text-xs text-muted flex-1">
              Push notifications help you stay informed about tool execution status and service
              health. You can customize which events trigger notifications.
            </Text>
          </View>
        </View>

        {/* Privacy Notice */}
        <View className="bg-warning/10 rounded-lg p-4 border border-warning/20 mb-12">
          <View className="flex-row gap-2">
            <MaterialIcons name="privacy-tip" size={16} color={colors.warning} />
            <Text className="text-xs text-muted flex-1">
              Notification preferences are stored locally on your device. No data is sent to
              external servers.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
