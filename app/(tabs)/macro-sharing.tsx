import { ScrollView, Text, View, Pressable, Alert, FlatList } from 'react-native';
import { useState, useCallback } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';
import { MacroSharingEngine } from '@/lib/engines/MacroSharingEngine';
import * as DocumentPicker from 'expo-document-picker';

/**
 * Macro Sharing Screen
 * Export, import, and share macros with teammates
 */
export default function MacroSharingScreen() {
  const colors = useColors();
  const { macros } = useMacroExecution();

  // State
  const [selectedMacros, setSelectedMacros] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [, setImportedCount] = useState(0);

  /**
   * Handle export selected macros
   */
  const handleExport = useCallback(async () => {
    if (selectedMacros.length === 0) {
      Alert.alert('Select Macros', 'Please select at least one macro to export');
      return;
    }

    setIsLoading(true);
    try {
      const macrosToExport = macros.filter((m) => selectedMacros.includes(m.id));
      await MacroSharingEngine.shareMacros(macrosToExport);
      setSelectedMacros([]);
      Alert.alert('Success', `Exported ${macrosToExport.length} macro(s)`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to export macros');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMacros, macros]);

  /**
   * Handle export all macros
   */
  const handleExportAll = useCallback(async () => {
    if (macros.length === 0) {
      Alert.alert('No Macros', 'You have no macros to export');
      return;
    }

    setIsLoading(true);
    try {
      await MacroSharingEngine.shareMacros(macros);
      Alert.alert('Success', `Exported all ${macros.length} macro(s)`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to export macros');
    } finally {
      setIsLoading(false);
    }
  }, [macros]);

  /**
   * Handle import macros
   */
  const handleImport = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.uri) {
        throw new Error('Invalid file');
      }

      setIsLoading(true);
      const importResult = await MacroSharingEngine.importMacros(file.uri);

      setImportedCount(importResult.imported);

      if (importResult.errors.length > 0) {
        Alert.alert(
          'Import Complete',
          `Imported: ${importResult.imported}\nSkipped: ${importResult.skipped}\n\nErrors:\n${importResult.errors.join('\n')}`
        );
      } else {
        Alert.alert('Success', `Imported ${importResult.imported} macro(s)`);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to import macros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle create backup
   */
  const handleBackup = useCallback(async () => {
    if (macros.length === 0) {
      Alert.alert('No Macros', 'You have no macros to backup');
      return;
    }

    setIsLoading(true);
    try {
      await MacroSharingEngine.createBackup(macros);
      Alert.alert('Success', `Backup created for ${macros.length} macro(s)`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  }, [macros]);

  /**
   * Toggle macro selection
   */
  const toggleMacroSelection = useCallback(
    (macroId: string) => {
      setSelectedMacros((prev) =>
        prev.includes(macroId) ? prev.filter((id) => id !== macroId) : [...prev, macroId]
      );
    },
    []
  );

  /**
   * Render macro list item
   */
  const renderMacroItem = ({ item }: { item: any }) => {
    const isSelected = selectedMacros.includes(item.id);

    return (
      <Pressable
        onPress={() => toggleMacroSelection(item.id)}
        className={cn(
          'flex-row items-center gap-3 p-4 rounded-lg border mb-3',
          isSelected ? 'bg-primary/10 border-primary' : 'bg-surface border-border'
        )}
      >
        <View
          className={cn(
            'w-6 h-6 rounded border-2 items-center justify-center',
            isSelected ? 'bg-primary border-primary' : 'border-border'
          )}
        >
          {isSelected && <MaterialIcons name="check" size={16} color="white" />}
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{item.name}</Text>
          <Text className="text-muted text-xs mt-1">{item.steps.length} steps</Text>
        </View>
        <Text className="text-muted text-xs">{item.usageCount} uses</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Share Macros</Text>
          <Text className="text-muted">Export, import, and backup your macros</Text>
        </View>

        {/* Quick Actions */}
        <View className="gap-3 mb-8">
          <Pressable
            onPress={handleExportAll}
            disabled={isLoading || macros.length === 0}
            className={cn(
              'flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg',
              isLoading || macros.length === 0 ? 'bg-border opacity-50' : 'bg-primary'
            )}
          >
            <MaterialIcons name="download" size={18} color="white" />
            <Text className="text-white font-semibold">Export All Macros</Text>
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={isLoading}
            className={cn('flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg', 'bg-surface border border-border')}
          >
            <MaterialIcons name="upload" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold">Import Macros</Text>
          </Pressable>

          <Pressable
            onPress={handleBackup}
            disabled={isLoading || macros.length === 0}
            className={cn(
              'flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg',
              isLoading || macros.length === 0 ? 'bg-border opacity-50' : 'bg-surface border border-border'
            )}
          >
            <MaterialIcons name="backup" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold">Create Backup</Text>
          </Pressable>
        </View>

        {/* Selection Actions */}
        {selectedMacros.length > 0 && (
          <View className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold">
                {selectedMacros.length} macro(s) selected
              </Text>
              <Pressable onPress={() => setSelectedMacros([])}>
                <Text className="text-primary font-semibold">Clear</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleExport}
              disabled={isLoading}
              className="py-2 px-3 bg-primary rounded flex-row items-center justify-center gap-2"
            >
              <MaterialIcons name="share" size={16} color="white" />
              <Text className="text-white font-semibold">Export Selected</Text>
            </Pressable>
          </View>
        )}

        {/* Macro List */}
        <View className="mb-4">
          <Text className="text-foreground font-semibold mb-3">Your Macros</Text>
          {macros.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-5xl mb-2">📦</Text>
              <Text className="text-foreground font-semibold mb-1">No Macros Yet</Text>
              <Text className="text-muted text-center text-sm">
                Create macros from the Macro Gallery to share them
              </Text>
            </View>
          ) : (
            <FlatList
              data={macros}
              renderItem={renderMacroItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Info Box */}
        <View className="p-4 bg-surface rounded-lg border border-border mt-6">
          <Text className="text-xs font-semibold text-foreground mb-2">💡 Sharing Tips</Text>
          <Text className="text-xs text-muted leading-relaxed">
            Export macros as JSON files to share with teammates. Import shared macros to add them to your collection. Create regular backups to protect your macro library.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
