import { ScrollView, Text, View, Pressable, Alert, FlatList, Switch } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';
import {
  MacroSchedulingEngine,
  ScheduleFrequency,
  MacroSchedule,
} from '@/lib/engines/MacroSchedulingEngine';

/**
 * Macro Scheduling Screen
 * Schedule macros for time-based execution
 */
export default function MacroSchedulingScreen() {
  const colors = useColors();
  const { macros } = useMacroExecution();

  // State
  const [schedules, setSchedules] = useState<MacroSchedule[]>([]);
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(ScheduleFrequency.DAILY);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load schedules on mount
   */
  useEffect(() => {
    loadSchedules();
  }, []);

  /**
   * Load all schedules
   */
  const loadSchedules = useCallback(async () => {
    try {
      const allSchedules = await MacroSchedulingEngine.getSchedules();
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }, []);

  /**
   * Handle create schedule
   */
  const handleCreateSchedule = useCallback(async () => {
    if (!selectedMacroId) {
      Alert.alert('Select Macro', 'Please select a macro to schedule');
      return;
    }

    setIsLoading(true);
    try {
      await MacroSchedulingEngine.createSchedule(selectedMacroId, frequency, scheduledTime);
      await loadSchedules();
      setSelectedMacroId(null);
      Alert.alert('Success', 'Schedule created');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMacroId, frequency, scheduledTime, loadSchedules]);

  /**
   * Handle delete schedule
   */
  const handleDeleteSchedule = useCallback(
    async (scheduleId: string) => {
      Alert.alert('Delete Schedule', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MacroSchedulingEngine.deleteSchedule(scheduleId);
              await loadSchedules();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          },
        },
      ]);
    },
    [loadSchedules],
  );

  /**
   * Handle toggle schedule
   */
  const handleToggleSchedule = useCallback(
    async (schedule: MacroSchedule) => {
      try {
        await MacroSchedulingEngine.updateSchedule(schedule.id, {
          isEnabled: !schedule.isEnabled,
        });
        await loadSchedules();
      } catch (error) {
        Alert.alert('Error', 'Failed to update schedule');
      }
    },
    [loadSchedules],
  );

  /**
   * Get macro name by ID
   */
  const getMacroName = (macroId: string): string => {
    return macros.find((m) => m.id === macroId)?.name || 'Unknown Macro';
  };

  /**
   * Format frequency display
   */
  const formatFrequency = (freq: ScheduleFrequency): string => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  /**
   * Render schedule item
   */
  const renderScheduleItem = ({ item }: { item: MacroSchedule }) => {
    const macro = macros.find((m) => m.id === item.macroId);

    return (
      <View className="p-4 bg-surface rounded-lg border border-border mb-3">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{macro?.name || 'Unknown'}</Text>
            <Text className="text-muted text-xs mt-1">
              {formatFrequency(item.frequency)} at {item.scheduledTime}
            </Text>
          </View>
          <Switch
            value={item.isEnabled}
            onValueChange={() => handleToggleSchedule(item)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {item.lastExecutedAt && (
          <Text className="text-muted text-xs mb-3">
            Last executed: {new Date(item.lastExecutedAt).toLocaleString()}
          </Text>
        )}

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleDeleteSchedule(item.id)}
            className="flex-1 py-2 px-3 bg-error/10 rounded flex-row items-center justify-center gap-2"
          >
            <MaterialIcons name="delete" size={14} color={colors.error} />
            <Text className="text-error text-xs font-semibold">Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Schedule Macros</Text>
          <Text className="text-muted">Set up time-based macro execution</Text>
        </View>

        {/* Create Schedule Form */}
        <View className="p-4 bg-surface rounded-lg border border-border mb-6">
          <Text className="text-foreground font-semibold mb-3">Create New Schedule</Text>

          {/* Macro Selection */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2">Select Macro</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {macros.map((macro) => (
                <Pressable
                  key={macro.id}
                  onPress={() => setSelectedMacroId(macro.id)}
                  className={cn(
                    'py-2 px-3 rounded-full border',
                    selectedMacroId === macro.id
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold',
                      selectedMacroId === macro.id ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {macro.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Frequency Selection */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2">Frequency</Text>
            <View className="flex-row gap-2 flex-wrap">
              {Object.values(ScheduleFrequency).map((freq) => (
                <Pressable
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  className={cn(
                    'py-2 px-3 rounded-full border',
                    frequency === freq
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border',
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold',
                      frequency === freq ? 'text-white' : 'text-foreground',
                    )}
                  >
                    {formatFrequency(freq)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-semibold mb-2">Time (HH:mm)</Text>
            <View className="flex-row items-center gap-2 bg-background rounded-lg p-3 border border-border">
              <MaterialIcons name="schedule" size={18} color={colors.foreground} />
              <Text className="text-foreground font-semibold flex-1">{scheduledTime}</Text>
              <Pressable
                onPress={() => {
                  const [h, m] = scheduledTime.split(':').map(Number);
                  const newH = (h + 1) % 24;
                  setScheduledTime(
                    `${String(newH).padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                  );
                }}
              >
                <MaterialIcons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Create Button */}
          <Pressable
            onPress={handleCreateSchedule}
            disabled={isLoading || !selectedMacroId}
            className={cn(
              'py-3 px-4 rounded-lg flex-row items-center justify-center gap-2',
              isLoading || !selectedMacroId ? 'bg-border opacity-50' : 'bg-primary',
            )}
          >
            <MaterialIcons name="add-circle" size={18} color="white" />
            <Text className="text-white font-semibold">Create Schedule</Text>
          </Pressable>
        </View>

        {/* Schedules List */}
        <View>
          <Text className="text-foreground font-semibold mb-3">Active Schedules</Text>
          {schedules.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-5xl mb-2">⏰</Text>
              <Text className="text-foreground font-semibold mb-1">No Schedules</Text>
              <Text className="text-muted text-center text-sm">
                Create a schedule above to automate macro execution
              </Text>
            </View>
          ) : (
            <FlatList
              data={schedules}
              renderItem={renderScheduleItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Info Box */}
        <View className="p-4 bg-surface rounded-lg border border-border mt-6">
          <Text className="text-xs font-semibold text-foreground mb-2">💡 Scheduling Tips</Text>
          <Text className="text-xs text-muted leading-relaxed">
            Schedules run in the background. Make sure to enable background app refresh in your
            device settings for reliable execution.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
