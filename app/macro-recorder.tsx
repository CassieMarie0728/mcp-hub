import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Recorder Screen
 * UI for recording action sequences by demonstration
 */
export default function MacroRecorderScreen() {
  const router = useRouter();
  const colors = useColors();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [macroName, setMacroName] = useState('');
  const [macroDescription, setMacroDescription] = useState('');
  const [recordedActions, setRecordedActions] = useState<any[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 100);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  /**
   * Start recording
   */
  const handleStartRecording = useCallback(() => {
    if (!macroName.trim()) {
      Alert.alert('Error', 'Please enter a macro name');
      return;
    }
    setIsRecording(true);
    setRecordedActions([]);
    setRecordingDuration(0);
  }, [macroName]);

  /**
   * Stop recording
   */
  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    Alert.alert('Recording Stopped', `Recorded ${recordedActions.length} actions in ${(recordingDuration / 1000).toFixed(1)}s`);
  }, [recordedActions.length, recordingDuration]);

  /**
   * Pause/Resume recording
   */
  const handleTogglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  /**
   * Simulate recording a tap
   */
  const handleRecordTap = useCallback(() => {
    if (!isRecording || isPaused) return;

    const newAction = {
      id: `action_${recordedActions.length}`,
      type: 'tap',
      x: Math.floor(Math.random() * 400) + 50,
      y: Math.floor(Math.random() * 600) + 100,
      timestamp: recordingDuration,
      description: `Tap at (${Math.floor(Math.random() * 400)}, ${Math.floor(Math.random() * 600)})`,
    };

    setRecordedActions((prev) => [...prev, newAction]);
  }, [isRecording, isPaused, recordingDuration, recordedActions.length]);

  /**
   * Simulate recording text input
   */
  const handleRecordText = useCallback(() => {
    if (!isRecording || isPaused) return;

    const newAction = {
      id: `action_${recordedActions.length}`,
      type: 'type_text',
      text: 'Sample text input',
      timestamp: recordingDuration,
      description: 'Type: "Sample text input"',
    };

    setRecordedActions((prev) => [...prev, newAction]);
  }, [isRecording, isPaused, recordingDuration, recordedActions.length]);

  /**
   * Simulate recording swipe
   */
  const handleRecordSwipe = useCallback(() => {
    if (!isRecording || isPaused) return;

    const newAction = {
      id: `action_${recordedActions.length}`,
      type: 'swipe',
      direction: 'down',
      distance: 300,
      timestamp: recordingDuration,
      description: 'Swipe down 300px',
    };

    setRecordedActions((prev) => [...prev, newAction]);
  }, [isRecording, isPaused, recordingDuration, recordedActions.length]);

  /**
   * Simulate recording wait
   */
  const handleRecordWait = useCallback(() => {
    if (!isRecording || isPaused) return;

    const newAction = {
      id: `action_${recordedActions.length}`,
      type: 'wait',
      duration: 1000,
      timestamp: recordingDuration,
      description: 'Wait 1000ms',
    };

    setRecordedActions((prev) => [...prev, newAction]);
  }, [isRecording, isPaused, recordingDuration, recordedActions.length]);

  /**
   * Delete action
   */
  const handleDeleteAction = useCallback((index: number) => {
    setRecordedActions((prev) => prev.filter((_, i) => i !== index));
    setSelectedActionIndex(null);
  }, []);

  /**
   * Clear all actions
   */
  const handleClearActions = useCallback(() => {
    Alert.alert('Clear All?', 'This will delete all recorded actions', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setRecordedActions([]);
          setSelectedActionIndex(null);
        },
      },
    ]);
  }, []);

  /**
   * Save macro
   */
  const handleSaveMacro = useCallback(() => {
    if (!macroName.trim()) {
      Alert.alert('Error', 'Please enter a macro name');
      return;
    }
    if (recordedActions.length === 0) {
      Alert.alert('Error', 'Please record at least one action');
      return;
    }

    Alert.alert('Success', `Macro "${macroName}" saved with ${recordedActions.length} actions`, [
      {
        text: 'OK',
        onPress: () => {
          setMacroName('');
          setMacroDescription('');
          setRecordedActions([]);
          setRecordingDuration(0);
          router.back();
        },
      },
    ]);
  }, [macroName, recordedActions, router]);

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    return `${seconds}.${String(millis).padStart(3, '0')}s`;
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Record Macro</Text>
            <Text className="text-base text-muted">Demonstrate actions to create a macro</Text>
          </View>

          {/* Macro Info */}
          <View className="gap-3 bg-surface rounded-xl p-4">
            <Text className="text-sm font-semibold text-muted">MACRO NAME</Text>
            <TextInput
              placeholder="Enter macro name"
              value={macroName}
              onChangeText={setMacroName}
              editable={!isRecording}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={colors.muted}
            />

            <Text className="text-sm font-semibold text-muted mt-2">DESCRIPTION</Text>
            <TextInput
              placeholder="Enter macro description (optional)"
              value={macroDescription}
              onChangeText={setMacroDescription}
              editable={!isRecording}
              multiline
              numberOfLines={2}
              className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Recording Status */}
          <View
            className={cn(
              'rounded-xl p-4 gap-3',
              isRecording ? 'bg-error/10 border border-error' : 'bg-surface border border-border'
            )}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {isRecording && (
                  <View className="w-3 h-3 rounded-full bg-error animate-pulse" />
                )}
                <Text className={cn('font-semibold', isRecording ? 'text-error' : 'text-foreground')}>
                  {isRecording ? 'RECORDING' : 'READY'}
                </Text>
              </View>
              <Text className="text-lg font-mono text-foreground">{formatDuration(recordingDuration)}</Text>
            </View>

            <Text className="text-sm text-muted">
              {recordedActions.length} action{recordedActions.length !== 1 ? 's' : ''} recorded
            </Text>
          </View>

          {/* Recording Controls */}
          <View className="gap-2">
            {!isRecording ? (
              <Pressable
                onPress={handleStartRecording}
                className="bg-primary rounded-lg p-4 active:opacity-80"
              >
                <Text className="text-center font-semibold text-background">Start Recording</Text>
              </Pressable>
            ) : (
              <View className="gap-2">
                <Pressable
                  onPress={handleTogglePause}
                  className={cn('rounded-lg p-4 active:opacity-80', isPaused ? 'bg-success' : 'bg-warning')}
                >
                  <Text className="text-center font-semibold text-background">
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleStopRecording}
                  className="bg-error rounded-lg p-4 active:opacity-80"
                >
                  <Text className="text-center font-semibold text-background">Stop Recording</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Action Recording Buttons */}
          {isRecording && !isPaused && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">RECORD ACTION</Text>
              <View className="gap-2">
                <Pressable
                  onPress={handleRecordTap}
                  className="bg-surface border border-border rounded-lg p-3 active:opacity-70"
                >
                  <Text className="text-center font-medium text-foreground">📍 Tap</Text>
                </Pressable>
                <Pressable
                  onPress={handleRecordText}
                  className="bg-surface border border-border rounded-lg p-3 active:opacity-70"
                >
                  <Text className="text-center font-medium text-foreground">⌨️ Type Text</Text>
                </Pressable>
                <Pressable
                  onPress={handleRecordSwipe}
                  className="bg-surface border border-border rounded-lg p-3 active:opacity-70"
                >
                  <Text className="text-center font-medium text-foreground">👆 Swipe</Text>
                </Pressable>
                <Pressable
                  onPress={handleRecordWait}
                  className="bg-surface border border-border rounded-lg p-3 active:opacity-70"
                >
                  <Text className="text-center font-medium text-foreground">⏱️ Wait</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Recorded Actions */}
          {recordedActions.length > 0 && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-muted">RECORDED ACTIONS</Text>
                <Pressable onPress={handleClearActions} className="active:opacity-70">
                  <Text className="text-xs font-semibold text-error">Clear All</Text>
                </Pressable>
              </View>

              <FlatList
                scrollEnabled={false}
                data={recordedActions}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <Pressable
                    onPress={() => setSelectedActionIndex(selectedActionIndex === index ? null : index)}
                    className={cn(
                      'rounded-lg p-3 mb-2 flex-row items-center justify-between',
                      selectedActionIndex === index ? 'bg-primary/20 border border-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {index + 1}. {item.type.toUpperCase()}
                      </Text>
                      <Text className="text-xs text-muted mt-1">{item.description}</Text>
                      <Text className="text-xs text-muted mt-1">@ {formatDuration(item.timestamp)}</Text>
                    </View>
                    {selectedActionIndex === index && (
                      <Pressable
                        onPress={() => handleDeleteAction(index)}
                        className="ml-2 p-2 active:opacity-70"
                      >
                        <Text className="text-error font-bold">✕</Text>
                      </Pressable>
                    )}
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-2">
            <Pressable
              onPress={handleSaveMacro}
              disabled={recordedActions.length === 0 || isRecording}
              className={cn(
                'rounded-lg p-4 active:opacity-80',
                recordedActions.length === 0 || isRecording ? 'bg-muted/50' : 'bg-success'
              )}
            >
              <Text className="text-center font-semibold text-background">
                Save Macro ({recordedActions.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
            >
              <Text className="text-center font-semibold text-foreground">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
