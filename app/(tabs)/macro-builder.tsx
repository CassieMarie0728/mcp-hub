import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import {
  useWorkflows,
  useCreateWorkflow,
  useSaveWorkflow,
  useExecuteWorkflow,
} from '@/hooks/use-api';

interface WorkflowStep {
  id: string;
  type: 'tool' | 'condition' | 'loop' | 'parallel';
  name: string;
  config: Record<string, any>;
  nextStepId?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: Date;
  lastModified: Date;
}

const STEP_TYPES = [
  { id: 'tool', name: 'Tool', icon: 'build', color: '#981518' },
  { id: 'condition', name: 'Condition', icon: 'call-split', color: '#22C55E' },
  { id: 'loop', name: 'Loop', icon: 'repeat', color: '#F59E0B' },
  { id: 'parallel', name: 'Parallel', icon: 'shuffle', color: '#a8a9ad' },
];

export default function MacroBuilderScreen() {
  const colors = useColors();
  const { data: fetchedWorkflows, loading, error: fetchError, refetch } = useWorkflows();
  const { mutate: createWorkflow, loading: createLoading } = useCreateWorkflow();
  const { mutate: saveWorkflow, loading: saveLoading } = useSaveWorkflow();
  const { mutate: executeWorkflow, loading: executeLoading } = useExecuteWorkflow();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<string | null>(null);

  useEffect(() => {
    if (fetchedWorkflows) {
      setWorkflows(fetchedWorkflows as Workflow[]);
    }
  }, [fetchedWorkflows]);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName) {
      Alert.alert('Name required', 'Give the workflow a name before building it.');
      return;
    }

    try {
      const newWorkflow = await createWorkflow({
        name: newWorkflowName,
        description: newWorkflowDesc,
      });
      const workflow: Workflow = {
        id: newWorkflow.id,
        name: newWorkflow.name,
        description: newWorkflow.description || '',
        steps: [],
        createdAt: new Date(),
        lastModified: new Date(),
      };
      setWorkflows([...workflows, workflow]);
      setSelectedWorkflow(workflow);
      setActiveTab('editor');
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      setShowNewModal(false);
      refetch();
    } catch (error: any) {
      Alert.alert('Workflow not created', error.message || 'The workflow could not be created.');
    }
  };

  const handleAddStep = (stepType: string) => {
    if (!selectedWorkflow) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: stepType as any,
      name: `${STEP_TYPES.find((s) => s.id === stepType)?.name} Step`,
      config: {},
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep],
      lastModified: new Date(),
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(workflows.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w)));
    setShowStepPicker(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedWorkflow) return;

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: selectedWorkflow.steps.filter((s) => s.id !== stepId),
      lastModified: new Date(),
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(workflows.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w)));
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow || selectedWorkflow.steps.length === 0) {
      Alert.alert('Add at least one step', 'A workflow needs at least one move before it can be saved.');
      return;
    }

    try {
      await saveWorkflow({
        id: selectedWorkflow.id,
        name: selectedWorkflow.name,
        description: selectedWorkflow.description,
        steps: selectedWorkflow.steps,
      });
      Alert.alert('Workflow saved', `Saved "${selectedWorkflow.name}".`);
      refetch();
    } catch (error: any) {
      Alert.alert('Workflow not saved', error.message || 'The workflow could not be saved.');
    }
  };

  const getStepTypeInfo = (type: string) => STEP_TYPES.find((s) => s.id === type);

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-row border-b border-border mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('list')}
          className={cn('flex-1 py-3 px-4 border-b-2', activeTab === 'list' ? 'border-primary' : 'border-transparent')}
        >
          <Text className={cn('text-center font-semibold', activeTab === 'list' ? 'text-primary' : 'text-muted')}>Workflows</Text>
        </TouchableOpacity>

        {selectedWorkflow && (
          <TouchableOpacity
            onPress={() => setActiveTab('editor')}
            className={cn('flex-1 py-3 px-4 border-b-2', activeTab === 'editor' ? 'border-primary' : 'border-transparent')}
          >
            <Text className={cn('text-center font-semibold', activeTab === 'editor' ? 'text-primary' : 'text-muted')}>Forge</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {activeTab === 'list' ? (
          <View className="flex-1">
            <View className="bg-primary rounded-2xl p-5 mb-4">
              <Text className="text-xs font-bold tracking-widest text-background/70">WORKFLOW FORGE</Text>
              <Text className="text-3xl font-bold text-background">Build the repeatable moves</Text>
              <Text className="text-sm text-background/80 leading-relaxed mt-2">
                Turn the jobs you repeat into saved workflows with clear steps and fewer loose ends.
              </Text>
            </View>

            {workflows.length === 0 ? (
              <View className="flex-1 items-center justify-center py-8 bg-surface rounded-2xl border border-border">
                <MaterialIcons name={'build' as any} size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No workflows yet</Text>
                <Text className="text-muted text-center mt-2 px-4">Create the first repeatable move and start building your system.</Text>
              </View>
            ) : (
              <View className="gap-3">
                {workflows.map((workflow) => (
                  <Pressable
                    key={workflow.id}
                    onPress={() => {
                      setSelectedWorkflow(workflow);
                      setActiveTab('editor');
                    }}
                    className="bg-surface rounded-lg p-4 border border-border"
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold text-lg">{workflow.name}</Text>
                        {workflow.description && <Text className="text-muted text-sm mt-1">{workflow.description}</Text>}
                      </View>
                      <View className="bg-primary/10 rounded-full px-3 py-1">
                        <Text className="text-primary text-xs font-semibold">{workflow.steps.length} steps</Text>
                      </View>
                    </View>
                    <Text className="text-muted text-xs">Modified: {formatDate(workflow.lastModified)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={() => setShowNewModal(true)} className="mt-6 bg-primary rounded-lg py-4 items-center">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="add" size={24} color="white" />
                <Text className="text-background font-semibold">Create Workflow</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <View className="mb-4 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-foreground font-bold text-lg mb-2">{selectedWorkflow?.name}</Text>
              {selectedWorkflow?.description && <Text className="text-muted text-sm">{selectedWorkflow.description}</Text>}
            </View>

            <View className="bg-surface rounded-lg p-4 mb-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-foreground font-semibold">Workflow steps</Text>
                <TouchableOpacity onPress={() => setShowStepPicker(true)} className="bg-primary rounded px-3 py-1">
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons name="add" size={16} color="white" />
                    <Text className="text-background text-xs font-semibold">Add Step</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {selectedWorkflow && selectedWorkflow.steps.length === 0 ? (
                <View className="items-center py-6">
                  <MaterialIcons name="info" size={32} color={colors.muted} />
                  <Text className="text-muted text-sm mt-2">No steps added yet</Text>
                </View>
              ) : (
                <View className="gap-2">
                  {selectedWorkflow?.steps.map((step, index) => {
                    const stepInfo = getStepTypeInfo(step.type);
                    return (
                      <View key={step.id}>
                        <View className="bg-background rounded p-3 border border-border flex-row items-center justify-between" style={{ borderLeftWidth: 4, borderLeftColor: stepInfo?.color }}>
                          <View className="flex-row items-center flex-1 gap-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: (stepInfo?.color || colors.primary) + '20' }}>
                              <MaterialIcons name={stepInfo?.icon as any} size={16} color={stepInfo?.color || colors.primary} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-foreground font-semibold text-sm">{step.name}</Text>
                              <Text className="text-muted text-xs">{stepInfo?.name}</Text>
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteStep(step.id)} className="p-2">
                            <MaterialIcons name="close" size={20} color={colors.error} />
                          </TouchableOpacity>
                        </View>

                        {index < (selectedWorkflow?.steps.length || 0) - 1 && (
                          <View className="items-center py-1">
                            <MaterialIcons name="arrow-downward" size={20} color={colors.muted} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity onPress={handleSaveWorkflow} disabled={loading} className="bg-primary rounded-lg py-4 items-center">
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="save" size={20} color="white" />
                  <Text className="text-background font-semibold">Save Workflow</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showNewModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-foreground font-bold text-lg">Create Workflow</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="text-muted text-xs mb-1">Workflow name</Text>
              <TextInput
                placeholder="Example: Morning repo check"
                value={newWorkflowName}
                onChangeText={setNewWorkflowName}
                className="bg-surface border border-border rounded px-3 py-2 text-foreground"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View>
              <Text className="text-muted text-xs mb-1">Description</Text>
              <TextInput
                placeholder="What repeatable job should this handle?"
                value={newWorkflowDesc}
                onChangeText={setNewWorkflowDesc}
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded px-3 py-2 text-foreground"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => setShowNewModal(false)} className="flex-1 bg-muted/10 rounded py-3 items-center">
                <Text className="text-muted font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateWorkflow} className="flex-1 bg-primary rounded py-3 items-center">
                <Text className="text-background font-semibold">Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showStepPicker} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-foreground font-bold text-lg">Add Step</Text>
              <TouchableOpacity onPress={() => setShowStepPicker(false)}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View className="gap-2 max-h-96">
              {STEP_TYPES.map((stepType) => (
                <TouchableOpacity key={stepType.id} onPress={() => handleAddStep(stepType.id)} className="bg-surface rounded-lg p-4 border border-border flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: stepType.color + '20' }}>
                    <MaterialIcons name={stepType.icon as any} size={20} color={stepType.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{stepType.name}</Text>
                    <Text className="text-muted text-xs">
                      {stepType.id === 'tool'
                        ? 'Run a connected tool'
                        : stepType.id === 'condition'
                        ? 'Branch when a rule matches'
                        : stepType.id === 'loop'
                        ? 'Repeat a set of steps'
                        : 'Run steps side by side'}
                    </Text>
                  </View>
                  <MaterialIcons name="arrow-forward" size={20} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
