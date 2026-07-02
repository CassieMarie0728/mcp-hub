import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Notification Preferences Screen
 * Customize notification types and delivery methods
 */
export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const colors = useColors();

  const [preferences, setPreferences] = useState({
    macro_execution: { enabled: true, inApp: true, push: true, email: false },
    collaboration_update: { enabled: true, inApp: true, push: true, email: false },
    anomaly_alert: { enabled: true, inApp: true, push: true, email: true },
    schedule_trigger: { enabled: true, inApp: true, push: false, email: false },
    fork_notification: { enabled: true, inApp: true, push: false, email: false },
    version_update: { enabled: true, inApp: true, push: false, email: false },
    system_alert: { enabled: true, inApp: true, push: true, email: true },
  });

  const [deliveryMethods, setDeliveryMethods] = useState({
    inApp: true,
    push: true,
    email: false,
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  });

  const [frequency, setFrequency] = useState({
    batchNotifications: false,
    maxPerDay: 999,
  });

  /**
   * Toggle notification type
   */
  const toggleNotificationType = (type: string) => {
    setPreferences({
      ...preferences,
      [type]: {
        ...preferences[type as keyof typeof preferences],
        enabled: !preferences[type as keyof typeof preferences].enabled,
      },
    });
  };

  /**
   * Toggle delivery method for notification type
   */
  const toggleDeliveryMethod = (type: string, method: 'inApp' | 'push' | 'email') => {
    setPreferences({
      ...preferences,
      [type]: {
        ...preferences[type as keyof typeof preferences],
        [method]: !preferences[type as keyof typeof preferences][method],
      },
    });
  };

  /**
   * Toggle delivery method globally
   */
  const toggleGlobalDeliveryMethod = (method: 'inApp' | 'push' | 'email') => {
    setDeliveryMethods({
      ...deliveryMethods,
      [method]: !deliveryMethods[method],
    });
  };

  /**
   * Save preferences
   */
  const savePreferences = () => {
    Alert.alert('Success', 'Notification preferences saved');
  };

  /**
   * Render notification type card
   */
  const renderNotificationTypeCard = (type: string, label: string) => {
    const pref = preferences[type as keyof typeof preferences];

    return (
      <View key={type} className="bg-surface rounded-xl p-4 mb-3 border border-border gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-foreground">{label}</Text>
          <Switch
            value={pref.enabled}
            onValueChange={() => toggleNotificationType(type)}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>

        {pref.enabled && (
          <View className="gap-2 pl-4 border-l border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">In-App</Text>
              <Switch
                value={pref.inApp}
                onValueChange={() => toggleDeliveryMethod(type, 'inApp')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Push Notification</Text>
              <Switch
                value={pref.push}
                onValueChange={() => toggleDeliveryMethod(type, 'push')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Email</Text>
              <Switch
                value={pref.email}
                onValueChange={() => toggleDeliveryMethod(type, 'email')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Notification Preferences</Text>
            <Text className="text-base text-muted">Customize how you receive notifications</Text>
          </View>

          {/* Global Delivery Methods */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="font-semibold text-foreground">Delivery Methods</Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">In-App Notifications</Text>
              <Switch
                value={deliveryMethods.inApp}
                onValueChange={() => toggleGlobalDeliveryMethod('inApp')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Push Notifications</Text>
              <Switch
                value={deliveryMethods.push}
                onValueChange={() => toggleGlobalDeliveryMethod('push')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Email Notifications</Text>
              <Switch
                value={deliveryMethods.email}
                onValueChange={() => toggleGlobalDeliveryMethod('email')}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>
          </View>

          {/* Quiet Hours */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-foreground">Quiet Hours</Text>
              <Switch
                value={quietHours.enabled}
                onValueChange={() => setQuietHours({ ...quietHours, enabled: !quietHours.enabled })}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            {quietHours.enabled && (
              <View className="gap-2 pl-4 border-l border-border">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">Start Time</Text>
                  <Text className="font-semibold text-foreground">{quietHours.startTime}</Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">End Time</Text>
                  <Text className="font-semibold text-foreground">{quietHours.endTime}</Text>
                </View>

                <Text className="text-xs text-muted mt-2">
                  Notifications will be muted during these hours
                </Text>
              </View>
            )}
          </View>

          {/* Frequency */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-foreground">Frequency</Text>
              <Switch
                value={frequency.batchNotifications}
                onValueChange={() =>
                  setFrequency({ ...frequency, batchNotifications: !frequency.batchNotifications })
                }
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            {frequency.batchNotifications && (
              <View className="pl-4 border-l border-border">
                <Text className="text-sm text-muted">
                  Notifications will be batched and sent hourly
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Max Notifications/Day</Text>
              <Text className="font-semibold text-foreground">{frequency.maxPerDay}</Text>
            </View>
          </View>

          {/* Notification Types */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">NOTIFICATION TYPES</Text>

            {renderNotificationTypeCard('macro_execution', 'Macro Execution')}
            {renderNotificationTypeCard('collaboration_update', 'Collaboration Updates')}
            {renderNotificationTypeCard('anomaly_alert', 'Anomaly Alerts')}
            {renderNotificationTypeCard('schedule_trigger', 'Schedule Triggers')}
            {renderNotificationTypeCard('fork_notification', 'Fork Notifications')}
            {renderNotificationTypeCard('version_update', 'Version Updates')}
            {renderNotificationTypeCard('system_alert', 'System Alerts')}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 bg-surface border border-border rounded-lg p-4 active:opacity-80"
            >
              <Text className="text-center font-semibold text-foreground">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={savePreferences}
              className="flex-1 bg-primary rounded-lg p-4 active:opacity-80"
            >
              <Text className="text-center font-semibold text-background">Save Preferences</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
