import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Debugger Screen
 * Step-through execution with breakpoints and variable inspection
 */
export default function MacroDebuggerScreen() {
  const router = useRouter();
  const colors = useColors();

  const [debugTab, setDebugTab] = useState<'execution' | 'variables' | 'breakpoints' | 'watch'>(
    'execution'
  );
  const [isPaused, setIsPaused] = useState(true);
  const [currentLine, setCurrentLine] = useState(5);
  const [newWatch, setNewWatch] = useState('');

  // Mock debug data
  const actions = [
    { line: 1, type: 'tap', target: 'Send Button', status: 'completed' },
    { line: 2, type: 'wait', duration: 500, status: 'completed' },
    { line: 3, type: 'type', text: 'Hello World', status: 'completed' },
    { line: 4, type: 'scroll', direction: 'down', status: 'completed' },
    { line: 5, type: 'tap', target: 'Confirm', status: 'current' },
    { line: 6, type: 'wait', duration: 1000, status: 'pending' },
  ];

  const variables = [
    { name: 'message', value: '"Hello World"', type: 'string' },
    { name: 'retryCount', value: '0', type: 'number' },
    { name: 'isSuccess', value: 'true', type: 'boolean' },
    { name: 'timestamp', value: '1711858800000', type: 'number' },
  ];

  const breakpoints = [3, 6, 10];
  const watches = [
    { id: '1', expression: '$message.length', value: '11' },
    { id: '2', expression: '$retryCount > 0', value: 'false' },
  ];

  /**
   * Render action line
   */
  const renderActionLine = ({ item }: { item: any }) => (
    <Pressable
      key={item.line}
      className={cn(
        'flex-row items-center gap-3 p-3 border-l-4 mb-2',
        item.status === 'current' && 'bg-primary/10 border-l-primary',
        item.status === 'completed' && 'bg-success/10 border-l-success',
        item.status === 'pending' && 'bg-surface border-l-muted'
      )}
      onPress={() => setCurrentLine(item.line)}
    >
      {/* Line Number */}
      <Text className="font-mono text-xs text-muted w-6">{item.line}</Text>

      {/* Status Indicator */}
      <View
        className={cn(
          'w-2 h-2 rounded-full',
          item.status === 'current' && 'bg-primary',
          item.status === 'completed' && 'bg-success',
          item.status === 'pending' && 'bg-muted'
        )}
      />

      {/* Action Details */}
      <View className="flex-1">
        <Text className="font-semibold text-foreground text-sm capitalize">{item.type}</Text>
        <Text className="text-xs text-muted">
          {item.target || item.text || item.direction || `${item.duration}ms`}
        </Text>
      </View>

      {/* Breakpoint Indicator */}
      {breakpoints.includes(item.line) && (
        <View className="bg-error rounded-full w-3 h-3" />
      )}
    </Pressable>
  );

  /**
   * Render variable
   */
  const renderVariable = ({ item }: { item: any }) => (
    <View key={item.name} className="bg-surface rounded-lg p-3 mb-2 border border-border gap-1">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-foreground">{item.name}</Text>
        <View className="bg-primary/20 rounded px-2 py-1">
          <Text className="text-xs font-mono text-primary">{item.type}</Text>
        </View>
      </View>
      <Text className="font-mono text-sm text-muted">{item.value}</Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Macro Debugger</Text>
            <Text className="text-base text-muted">Step through execution</Text>
          </View>

          {/* Control Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setIsPaused(!isPaused)}
              className={cn(
                'flex-1 rounded-lg p-3 active:opacity-80',
                isPaused ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  isPaused ? 'text-background' : 'text-foreground'
                )}
              >
                {isPaused ? '▶ Continue' : '⏸ Pause'}
              </Text>
            </Pressable>

            <Pressable className="flex-1 bg-surface border border-border rounded-lg p-3 active:opacity-80">
              <Text className="text-center font-semibold text-sm text-foreground">⬇ Step Over</Text>
            </Pressable>

            <Pressable className="flex-1 bg-surface border border-border rounded-lg p-3 active:opacity-80">
              <Text className="text-center font-semibold text-sm text-foreground">⤵ Step Into</Text>
            </Pressable>

            <Pressable className="flex-1 bg-surface border border-border rounded-lg p-3 active:opacity-80">
              <Text className="text-center font-semibold text-sm text-foreground">⤴ Step Out</Text>
            </Pressable>
          </View>

          {/* Progress */}
          <View className="bg-surface rounded-lg p-3 border border-border gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">Execution Progress</Text>
              <Text className="text-xs text-muted">5/6 (83%)</Text>
            </View>
            <View className="h-2 bg-background rounded-full border border-border overflow-hidden">
              <View className="h-full bg-primary" style={{ width: '83%' }} />
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-1 bg-surface rounded-lg p-1 border border-border">
            {(['execution', 'variables', 'breakpoints', 'watch'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setDebugTab(tab)}
                className={cn(
                  'flex-1 rounded-md p-2 active:opacity-80',
                  debugTab === tab ? 'bg-primary' : 'bg-transparent'
                )}
              >
                <Text
                  className={cn(
                    'text-center font-semibold text-xs',
                    debugTab === tab ? 'text-background' : 'text-foreground'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Execution Tab */}
          {debugTab === 'execution' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">ACTION TIMELINE</Text>
              <FlatList
                scrollEnabled={false}
                data={actions}
                keyExtractor={(item) => item.line.toString()}
                renderItem={renderActionLine}
              />
            </View>
          )}

          {/* Variables Tab */}
          {debugTab === 'variables' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">LOCAL VARIABLES</Text>
              <FlatList
                scrollEnabled={false}
                data={variables}
                keyExtractor={(item) => item.name}
                renderItem={renderVariable}
              />
            </View>
          )}

          {/* Breakpoints Tab */}
          {debugTab === 'breakpoints' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">BREAKPOINTS</Text>
              {breakpoints.map((line) => (
                <View
                  key={line}
                  className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="bg-error rounded-full w-3 h-3" />
                    <Text className="font-semibold text-foreground">Line {line}</Text>
                  </View>
                  <Pressable className="active:opacity-80">
                    <Text className="text-sm text-error">Remove</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable className="bg-primary rounded-lg p-3 active:opacity-80 mt-2">
                <Text className="text-center font-semibold text-background text-sm">
                  + Add Breakpoint
                </Text>
              </Pressable>
            </View>
          )}

          {/* Watch Tab */}
          {debugTab === 'watch' && (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-muted">WATCH EXPRESSIONS</Text>

              {watches.map((watch) => (
                <View
                  key={watch.id}
                  className="bg-surface rounded-lg p-3 border border-border gap-1"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-mono text-sm text-foreground">{watch.expression}</Text>
                    <Pressable className="active:opacity-80">
                      <Text className="text-xs text-error">×</Text>
                    </Pressable>
                  </View>
                  <Text className="font-mono text-sm text-muted">{watch.value}</Text>
                </View>
              ))}

              <View className="bg-surface rounded-lg border border-border p-2 gap-2 mt-2">
                <TextInput
                  placeholder="Add watch expression (e.g., $message.length)"
                  placeholderTextColor={colors.muted}
                  value={newWatch}
                  onChangeText={setNewWatch}
                  className="text-foreground p-2 border border-border rounded"
                  style={{ color: colors.foreground }}
                />
                <Pressable className="bg-primary rounded-lg p-2 active:opacity-80">
                  <Text className="text-center font-semibold text-background text-sm">
                    Add Watch
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80 mt-4"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
