import { ScrollView, Text, View, Pressable, Alert, FlatList, Modal } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';
import { MacroChainingEngine, MacroChain, MacroChainStep } from '@/lib/engines/MacroChainingEngine';

/**
 * Macro Chaining Screen
 * Create and manage macro chains (macro composition)
 */
export default function MacroChainingScreen() {
  const colors = useColors();
  const { macros } = useMacroExecution();

  // State
  const [chains, setChains] = useState<MacroChain[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chainName, setChainName] = useState('');
  const [selectedMacros, setSelectedMacros] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle create chain
   */
  const handleCreateChain = useCallback(async () => {
    if (!chainName.trim()) {
      Alert.alert('Name Required', 'Please enter a chain name');
      return;
    }

    if (selectedMacros.length < 2) {
      Alert.alert('Select Macros', 'Please select at least 2 macros for a chain');
      return;
    }

    setIsLoading(true);
    try {
      const macroSequence: MacroChainStep[] = selectedMacros.map((macroId, index) => ({
        order: index,
        macroId,
        macroName: macros.find((m) => m.id === macroId)?.name || 'Unknown',
        continueOnError: false,
      }));

      const newChain = MacroChainingEngine.createChain(chainName, macroSequence);
      setChains([...chains, newChain]);

      setChainName('');
      setSelectedMacros([]);
      setShowCreateModal(false);

      Alert.alert('Success', 'Chain created');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create chain');
    } finally {
      setIsLoading(false);
    }
  }, [chainName, selectedMacros, macros, chains]);

  /**
   * Handle delete chain
   */
  const handleDeleteChain = useCallback(
    (chainId: string) => {
      Alert.alert('Delete Chain', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setChains(chains.filter((c) => c.id !== chainId));
          },
        },
      ]);
    },
    [chains],
  );

  /**
   * Handle execute chain
   */
  const handleExecuteChain = useCallback(
    async (chain: MacroChain) => {
      setIsLoading(true);
      try {
        const macroMap = new Map(macros.map((m) => [m.id, m]));
        const execution = await MacroChainingEngine.executeChain(chain, macroMap);

        if (execution.status === 'success') {
          Alert.alert(
            'Chain Executed',
            `Completed ${execution.stepResults.length} step(s) in ${Math.round((execution.completedAt! - execution.startedAt) / 1000)}s`,
          );
        } else {
          Alert.alert('Chain Failed', `Errors:\n${execution.errors.join('\n')}`);
        }
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to execute chain');
      } finally {
        setIsLoading(false);
      }
    },
    [macros],
  );

  /**
   * Toggle macro selection
   */
  const toggleMacroSelection = useCallback((macroId: string) => {
    setSelectedMacros((prev) =>
      prev.includes(macroId) ? prev.filter((id) => id !== macroId) : [...prev, macroId],
    );
  }, []);

  /**
   * Render macro selector item
   */
  const renderMacroSelector = ({ item }: { item: any }) => {
    const isSelected = selectedMacros.includes(item.id);

    return (
      <Pressable
        onPress={() => toggleMacroSelection(item.id)}
        className={cn(
          'flex-row items-center gap-3 p-3 rounded-lg border mb-2',
          isSelected ? 'bg-primary/10 border-primary' : 'bg-background border-border',
        )}
      >
        <View
          className={cn(
            'w-5 h-5 rounded border-2 items-center justify-center',
            isSelected ? 'bg-primary border-primary' : 'border-border',
          )}
        >
          {isSelected && <MaterialIcons name="check" size={14} color="white" />}
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-sm">{item.name}</Text>
        </View>
        <Text className="text-muted text-xs">{item.steps.length} steps</Text>
      </Pressable>
    );
  };

  /**
   * Render chain item
   */
  const renderChainItem = ({ item }: { item: MacroChain }) => {
    return (
      <View className="p-4 bg-surface rounded-lg border border-border mb-3">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{item.name}</Text>
            <Text className="text-muted text-xs mt-1">{item.macroIds.length} macros in chain</Text>
          </View>
          <Text className="text-muted text-xs">{item.usageCount} executions</Text>
        </View>

        {/* Macro sequence preview */}
        <View className="mb-3 gap-1">
          {item.macroSequence.slice(0, 3).map((step, idx) => (
            <View key={idx} className="flex-row items-center gap-2">
              <Text className="text-muted text-xs">{idx + 1}.</Text>
              <Text className="text-foreground text-xs flex-1">{step.macroName}</Text>
              {idx < item.macroSequence.length - 1 && (
                <MaterialIcons name="arrow-downward" size={12} color={colors.muted} />
              )}
            </View>
          ))}
          {item.macroSequence.length > 3 && (
            <Text className="text-muted text-xs">+{item.macroSequence.length - 3} more</Text>
          )}
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => handleExecuteChain(item)}
            disabled={isLoading}
            className="flex-1 py-2 px-3 bg-primary rounded flex-row items-center justify-center gap-1"
          >
            <MaterialIcons name="play-arrow" size={14} color="white" />
            <Text className="text-white text-xs font-semibold">Execute</Text>
          </Pressable>

          <Pressable
            onPress={() => handleDeleteChain(item.id)}
            className="flex-1 py-2 px-3 bg-error/10 rounded flex-row items-center justify-center gap-1"
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
          <Text className="text-3xl font-bold text-foreground mb-2">Macro Chains</Text>
          <Text className="text-muted">Compose workflows from multiple macros</Text>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="py-3 px-4 bg-primary rounded-lg flex-row items-center justify-center gap-2 mb-6"
        >
          <MaterialIcons name="add" size={18} color="white" />
          <Text className="text-white font-semibold">Create Chain</Text>
        </Pressable>

        {/* Chains List */}
        <View>
          <Text className="text-foreground font-semibold mb-3">Your Chains</Text>
          {chains.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-5xl mb-2">🔗</Text>
              <Text className="text-foreground font-semibold mb-1">No Chains Yet</Text>
              <Text className="text-muted text-center text-sm">
                Create a chain to compose multiple macros into a workflow
              </Text>
            </View>
          ) : (
            <FlatList
              data={chains}
              renderItem={renderChainItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Info Box */}
        <View className="p-4 bg-surface rounded-lg border border-border mt-6">
          <Text className="text-xs font-semibold text-foreground mb-2">💡 Chain Tips</Text>
          <Text className="text-xs text-muted leading-relaxed">
            Chains execute macros in sequence. Use parameter mapping to pass results between steps.
            Set &quot;Continue on Error&quot; to skip failed steps.
          </Text>
        </View>
      </ScrollView>

      {/* Create Chain Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">Create Chain</Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chain Name */}
              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2">Chain Name</Text>
                <View className="bg-surface rounded-lg border border-border p-3">
                  <Text className="text-foreground">{chainName || 'Enter name...'}</Text>
                </View>
              </View>

              {/* Macro Selection */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-foreground font-semibold">Select Macros</Text>
                  <Text className="text-muted text-xs">{selectedMacros.length} selected</Text>
                </View>
                <FlatList
                  data={macros}
                  renderItem={renderMacroSelector}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 mt-6">
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 bg-surface rounded-lg border border-border"
                >
                  <Text className="text-foreground font-semibold text-center">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateChain}
                  disabled={isLoading || !chainName.trim() || selectedMacros.length < 2}
                  className={cn(
                    'flex-1 py-3 px-4 rounded-lg',
                    isLoading || !chainName.trim() || selectedMacros.length < 2
                      ? 'bg-border opacity-50'
                      : 'bg-primary',
                  )}
                >
                  <Text className="text-white font-semibold text-center">Create</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
