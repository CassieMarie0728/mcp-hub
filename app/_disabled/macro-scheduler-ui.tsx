import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Scheduler UI Screen
 * Schedule macros to run at specific times or intervals
 */
export default function MacroSchedulerUIScreen() {
  const router = useRouter();
  const colors = useColors();

  // State
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState<'cron' | 'interval' | 'once'>('interval');
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [executeTime, setExecuteTime] = useState('09:00');
  const [retryOnFailure, setRetryOnFailure] = useState(true);
  const [maxRetries, setMaxRetries] = useState('3');
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(true);
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);

  /**
   * Add new schedule
   */
  const handleAddSchedule = useCallback(() => {
    if (scheduleType === 'cron' && !cronExpression.trim()) {
      Alert.alert('Error', 'Please enter a cron expression');
      return;
    }

    if (scheduleType === 'interval' && !intervalMinutes.trim()) {
      Alert.alert('Error', 'Please enter an interval');
      return;
    }

    const newSchedule = {
      id: `schedule_${Date.now()}`,
      type: scheduleType,
      cronExpression: scheduleType === 'cron' ? cronExpression : undefined,
      interval: scheduleType === 'interval' ? parseInt(intervalMinutes) * 60 * 1000 : undefined,
      executeTime: scheduleType === 'once' ? executeTime : undefined,
      enabled: true,
      retryOnFailure,
      maxRetries: parseInt(maxRetries),
      notifyOnSuccess,
      notifyOnFailure,
      createdAt: new Date(),
      nextRun: new Date(),
      lastRun: null,
      executionCount: 0,
    };

    setSchedules([...schedules, newSchedule]);
    setShowNewSchedule(false);
    Alert.alert('Success', 'Schedule created successfully');
  }, [
    scheduleType,
    cronExpression,
    intervalMinutes,
    executeTime,
    retryOnFailure,
    maxRetries,
    notifyOnSuccess,
    notifyOnFailure,
  ]);

  /**
   * Toggle schedule
   */
  const handleToggleSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }, []);

  /**
   * Delete schedule
   */
  const handleDeleteSchedule = useCallback((id: string) => {
    Alert.alert('Delete Schedule?', 'This action cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSchedules((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  }, []);

  /**
   * Format interval
   */
  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  /**
   * Render schedule card
   */
  const renderScheduleCard = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => setSelectedSchedule(item)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {item.type.toUpperCase()} Schedule
            </Text>
            <Text className="text-xs text-muted mt-1">
              {item.type === 'cron' && `Cron: ${item.cronExpression}`}
              {item.type === 'interval' && `Every ${formatInterval(item.interval / 60 / 1000)}`}
              {item.type === 'once' && `At ${item.executeTime}`}
            </Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => handleToggleSchedule(item.id)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View className="flex-row items-center justify-between text-xs text-muted">
          <Text className="text-xs text-muted">Executions: {item.executionCount}</Text>
          <Text className="text-xs text-muted">
            {item.lastRun ? `Last: ${new Date(item.lastRun).toLocaleTimeString()}` : 'Never run'}
          </Text>
        </View>

        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => handleDeleteSchedule(item.id)}
            className="flex-1 bg-error/20 rounded-lg p-2 active:opacity-70"
          >
            <Text className="text-center text-xs font-semibold text-error">Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  /**
   * Render new schedule form
   */
  const renderNewScheduleForm = () => {
    if (!showNewSchedule) return null;

    return (
      <View className="bg-surface rounded-xl p-4 mb-4 border border-border gap-3">
        <Text className="text-lg font-semibold text-foreground">Create New Schedule</Text>

        {/* Schedule Type */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-muted">SCHEDULE TYPE</Text>
          <View className="flex-row gap-2">
            {['cron', 'interval', 'once'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setScheduleType(type as any)}
                className={cn(
                  'flex-1 rounded-lg p-2 active:opacity-80',
                  scheduleType === type ? 'bg-primary' : 'bg-background border border-border',
                )}
              >
                <Text
                  className={cn(
                    'text-center text-xs font-semibold capitalize',
                    scheduleType === type ? 'text-background' : 'text-foreground',
                  )}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Cron Expression */}
        {scheduleType === 'cron' && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">CRON EXPRESSION</Text>
            <TextInput
              placeholder="0 9 * * * (daily at 9am)"
              value={cronExpression}
              onChangeText={setCronExpression}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <Text className="text-xs text-muted">
              Format: second minute hour day month dayOfWeek
            </Text>
          </View>
        )}

        {/* Interval */}
        {scheduleType === 'interval' && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">INTERVAL (MINUTES)</Text>
            <TextInput
              placeholder="60"
              value={intervalMinutes}
              onChangeText={setIntervalMinutes}
              keyboardType="number-pad"
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
        )}

        {/* Execute Time */}
        {scheduleType === 'once' && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">EXECUTE AT</Text>
            <TextInput
              placeholder="09:00"
              value={executeTime}
              onChangeText={setExecuteTime}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>
        )}

        {/* Options */}
        <View className="gap-3 bg-background rounded-lg p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Retry on Failure</Text>
            <Switch
              value={retryOnFailure}
              onValueChange={setRetryOnFailure}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {retryOnFailure && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">MAX RETRIES</Text>
              <TextInput
                placeholder="3"
                value={maxRetries}
                onChangeText={setMaxRetries}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                placeholderTextColor={colors.muted}
              />
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Notify on Success</Text>
            <Switch
              value={notifyOnSuccess}
              onValueChange={setNotifyOnSuccess}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Notify on Failure</Text>
            <Switch
              value={notifyOnFailure}
              onValueChange={setNotifyOnFailure}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <Pressable
            onPress={handleAddSchedule}
            className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
          >
            <Text className="text-center font-semibold text-background">Create</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowNewSchedule(false)}
            className="flex-1 bg-surface border border-border rounded-lg p-3 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Macro Scheduler</Text>
            <Text className="text-base text-muted">Schedule macros to run automatically</Text>
          </View>

          {/* New Schedule Form */}
          {renderNewScheduleForm()}

          {/* Add Schedule Button */}
          {!showNewSchedule && (
            <Pressable
              onPress={() => setShowNewSchedule(true)}
              className="bg-primary rounded-lg p-4 active:opacity-80"
            >
              <Text className="text-center font-semibold text-background">+ New Schedule</Text>
            </Pressable>
          )}

          {/* Schedules List */}
          {schedules.length > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">
                ACTIVE SCHEDULES ({schedules.length})
              </Text>
              <FlatList
                scrollEnabled={false}
                data={schedules}
                keyExtractor={(item) => item.id}
                renderItem={renderScheduleCard}
              />
            </View>
          ) : (
            <View className="py-8 items-center">
              <Text className="text-muted">No schedules yet</Text>
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
