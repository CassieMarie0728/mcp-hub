import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';
import { useToolDiscovery } from '@/lib/hooks/useToolDiscovery';
import { useMCPServerConnection } from '@/lib/hooks/useMCPServerConnection';
import { Macro, MacroStep, MACRO_TEMPLATES, MacroManager } from '@/lib/models/Macro';
import { cn } from '@/lib/utils';

export default function MacroEditorScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, template: templateKey, new: isNew } = useLocalSearchParams();

  const { macros, createFromTemplate } = useMacroExecution();
  const { servers } = useMCPServerConnection();
  const { tools } = useToolDiscovery();

  const [macro, setMacro] = useState<Macro | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Load macro on mount
  useEffect(() => {
    const loadMacro = async () => {
      try {
        setIsLoading(true);

        if (templateKey && typeof templateKey === 'string') {
          // Create from template
          const template = MACRO_TEMPLATES[templateKey];
          if (!template) {
            Alert.alert('Error', 'Template not found');
            router.back();
            return;
          }

          const now = Date.now();
          const steps: MacroStep[] = template.steps.map((step, index) => ({
            ...step,
            id: `step_${now}_${index}`,
            order: index,
          }));

          setMacro({
            id: `macro_${now}_${Math.random().toString(36).substr(2, 9)}`,
            name: template.name,
            description: template.description,
            steps,
            variables: template.variables,
            tags: template.tags,
            isFavorite: false,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
            version: 1,
          });
        } else if (id && typeof id === 'string') {
          // Load existing macro
          const existing = macros.find((m) => m.id === id);
          if (!existing) {
            Alert.alert('Error', 'Macro not found');
            router.back();
            return;
          }
          setMacro(existing);
        } else {
          // Create new macro
          const now = Date.now();
          setMacro({
            id: `macro_${now}_${Math.random().toString(36).substr(2, 9)}`,
            name: 'New Macro',
            description: '',
            steps: [],
            variables: [],
            tags: [],
            isFavorite: false,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
            version: 1,
          });
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load macro');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadMacro();
  }, [id, templateKey, macros, router]);

  // Save macro
  const handleSaveMacro = useCallback(async () => {
    if (!macro) return;

    if (!macro.name.trim()) {
      Alert.alert('Validation Error', 'Macro name is required');
      return;
    }

    if (macro.steps.length === 0) {
      Alert.alert('Validation Error', 'Add at least one step to the macro');
      return;
    }

    try {
      setIsSaving(true);

      // Check if macro already exists
      const existing = macros.find((m) => m.id === macro.id);

      if (existing) {
        // Update existing
        await MacroManager.updateMacro(macro.id, macro);
      } else {
        // Create new
        await MacroManager.createMacro({
          name: macro.name,
          description: macro.description,
          steps: macro.steps,
          variables: macro.variables,
          tags: macro.tags,
          isFavorite: macro.isFavorite,
          usageCount: 0,
        });
      }

      Alert.alert('Success', 'Macro saved successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save macro');
    } finally {
      setIsSaving(false);
    }
  }, [macro, macros, router]);

  // Add step
  const handleAddStep = useCallback(() => {
    if (!macro) return;

    const newStep: MacroStep = {
      id: `step_${Date.now()}`,
      serverId: servers[0]?.id || '',
      serverName: servers[0]?.name || '',
      toolName: '',
      parameters: {},
      order: macro.steps.length,
    };

    setMacro({
      ...macro,
      steps: [...macro.steps, newStep],
    });

    setEditingStepIndex(macro.steps.length);
  }, [macro, servers]);

  // Remove step
  const handleRemoveStep = useCallback(
    (index: number) => {
      if (!macro) return;

      Alert.alert('Remove Step', 'Are you sure you want to remove this step?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newSteps = macro.steps.filter((_, i) => i !== index);
            setMacro({
              ...macro,
              steps: newSteps.map((step, i) => ({ ...step, order: i })),
            });
            setEditingStepIndex(null);
          },
        },
      ]);
    },
    [macro],
  );

  // Update step
  const handleUpdateStep = useCallback(
    (index: number, updates: Partial<MacroStep>) => {
      if (!macro) return;

      const newSteps = [...macro.steps];
      newSteps[index] = { ...newSteps[index], ...updates };

      setMacro({
        ...macro,
        steps: newSteps,
      });
    },
    [macro],
  );

  if (isLoading || !macro) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Edit Macro</Text>
        </View>

        {/* Macro Details */}
        <View className="bg-surface rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-muted mb-2">Macro Name</Text>
          <TextInput
            value={macro.name}
            onChangeText={(text) => setMacro({ ...macro, name: text })}
            placeholder="Enter macro name"
            placeholderTextColor={colors.muted}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          />

          <Text className="text-sm font-semibold text-muted mb-2">Description</Text>
          <TextInput
            value={macro.description || ''}
            onChangeText={(text) => setMacro({ ...macro, description: text })}
            placeholder="Enter macro description (optional)"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
          />

          <Text className="text-sm font-semibold text-muted mb-2 mt-4">Tags</Text>
          <TextInput
            value={(macro.tags || []).join(', ')}
            onChangeText={(text) =>
              setMacro({
                ...macro,
                tags: text.split(',').map((t) => t.trim()),
              })
            }
            placeholder="Enter tags separated by commas"
            placeholderTextColor={colors.muted}
            className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
          />
        </View>

        {/* Steps Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-foreground">Steps ({macro.steps.length})</Text>
            <Pressable onPress={handleAddStep} className="bg-primary rounded-lg px-4 py-2">
              <Text className="text-white font-semibold">+ Add Step</Text>
            </Pressable>
          </View>

          {macro.steps.length === 0 ? (
            <View className="bg-surface rounded-lg p-6 items-center">
              <Text className="text-2xl mb-2">📝</Text>
              <Text className="text-foreground font-semibold">No steps yet</Text>
              <Text className="text-muted text-center mt-2">Add steps to build your macro</Text>
            </View>
          ) : (
            <FlatList
              data={macro.steps}
              renderItem={({ item, index }) => (
                <View key={item.id} className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-sm text-muted">Step {index + 1}</Text>
                      <Text className="text-base font-semibold text-foreground mt-1">
                        {item.toolName || 'Select a tool'}
                      </Text>
                      <Text className="text-xs text-muted mt-1">{item.serverName}</Text>
                    </View>

                    <Pressable
                      onPress={() => handleRemoveStep(index)}
                      className="bg-error/10 px-3 py-2 rounded"
                    >
                      <Text className="text-error text-sm font-semibold">Delete</Text>
                    </Pressable>
                  </View>

                  {editingStepIndex === index ? (
                    <View className="bg-background rounded p-3">
                      <Text className="text-xs font-semibold text-muted mb-2">Server</Text>
                      <View className="bg-surface border border-border rounded p-2 mb-3">
                        {servers.map((server) => (
                          <Pressable
                            key={server.id}
                            onPress={() =>
                              handleUpdateStep(index, {
                                serverId: server.id,
                                serverName: server.name,
                              })
                            }
                            className={cn(
                              'p-2 rounded mb-1',
                              item.serverId === server.id ? 'bg-primary/20' : '',
                            )}
                          >
                            <Text
                              className={cn(
                                'text-sm',
                                item.serverId === server.id
                                  ? 'text-primary font-semibold'
                                  : 'text-foreground',
                              )}
                            >
                              {server.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text className="text-xs font-semibold text-muted mb-2">Tool</Text>
                      <View className="bg-surface border border-border rounded p-2 max-h-40">
                        <FlatList
                          data={tools.filter((t) => t.name.length > 0)}
                          renderItem={({ item: tool }) => (
                            <Pressable
                              onPress={() =>
                                handleUpdateStep(index, {
                                  toolName: tool.name,
                                })
                              }
                              className={cn(
                                'p-2 rounded mb-1',
                                item.toolName === tool.name ? 'bg-primary/20' : '',
                              )}
                            >
                              <Text
                                className={cn(
                                  'text-sm',
                                  item.toolName === tool.name
                                    ? 'text-primary font-semibold'
                                    : 'text-foreground',
                                )}
                              >
                                {tool.name}
                              </Text>
                            </Pressable>
                          )}
                          keyExtractor={(tool) => tool.name}
                          scrollEnabled={true}
                        />
                      </View>

                      <Pressable
                        onPress={() => setEditingStepIndex(null)}
                        className="bg-primary rounded p-2 mt-3"
                      >
                        <Text className="text-white font-semibold text-center">Done</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setEditingStepIndex(index)}
                      className="bg-primary/10 rounded p-2"
                    >
                      <Text className="text-primary font-semibold text-center text-sm">
                        Edit Step
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 bg-surface border border-border rounded-lg py-3"
            disabled={isSaving}
          >
            <Text className="text-foreground font-semibold text-center">Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSaveMacro}
            className="flex-1 bg-primary rounded-lg py-3"
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-center">Save Macro</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
