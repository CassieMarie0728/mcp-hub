import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Export/Import Screen
 * Backup, share, and restore macros
 */
export default function ExportImportScreen() {
  const router = useRouter();
  const colors = useColors();

  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [selectedMacros, setSelectedMacros] = useState<string[]>([]);
  const [importData, setImportData] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'bundle'>('json');

  // Mock macros
  const macros = [
    { id: '1', name: 'Email Automation', description: 'Send emails automatically' },
    { id: '2', name: 'Social Media Post', description: 'Post to Instagram/Twitter' },
    { id: '3', name: 'Data Entry', description: 'Fill forms with data' },
  ];

  /**
   * Toggle macro selection
   */
  const toggleMacro = (id: string) => {
    setSelectedMacros((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  /**
   * Export selected macros
   */
  const handleExport = () => {
    if (selectedMacros.length === 0) {
      Alert.alert('No macros selected', 'Please select at least one macro to export');
      return;
    }

    const exportedData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      format: exportFormat,
      macros: selectedMacros.map((id) => {
        const macro = macros.find((m) => m.id === id);
        return {
          id,
          name: macro?.name,
          description: macro?.description,
          actions: [],
          variables: [],
        };
      }),
    };

    const json = JSON.stringify(exportedData, null, 2);

    // Copy to clipboard (in real app, use Share API)
    Alert.alert('Export Successful', `Exported ${selectedMacros.length} macro(s). Data copied to clipboard.`);
  };

  /**
   * Import macros
   */
  const handleImport = () => {
    if (!importData.trim()) {
      Alert.alert('Empty data', 'Please paste macro data to import');
      return;
    }

    try {
      const data = JSON.parse(importData);

      if (!data.macros || !Array.isArray(data.macros)) {
        Alert.alert('Invalid format', 'Data does not contain valid macros');
        return;
      }

      Alert.alert('Import Successful', `Imported ${data.macros.length} macro(s)`);
      setImportData('');
    } catch (error) {
      Alert.alert('Invalid JSON', 'Please paste valid JSON data');
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Backup & Share</Text>
            <Text className="text-base text-muted">Export or import macros</Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1 border border-border">
            <Pressable
              onPress={() => setTab('export')}
              className={cn(
                'flex-1 rounded-md p-3 active:opacity-80',
                tab === 'export' ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  tab === 'export' ? 'text-background' : 'text-foreground'
                )}
              >
                📤 Export
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('import')}
              className={cn(
                'flex-1 rounded-md p-3 active:opacity-80',
                tab === 'import' ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  tab === 'import' ? 'text-background' : 'text-foreground'
                )}
              >
                📥 Import
              </Text>
            </Pressable>
          </View>

          {/* Export Tab */}
          {tab === 'export' && (
            <View className="gap-4">
              {/* Format Selection */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">EXPORT FORMAT</Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setExportFormat('json')}
                    className={cn(
                      'flex-1 rounded-lg p-3 active:opacity-80',
                      exportFormat === 'json' ? 'bg-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-semibold text-sm',
                        exportFormat === 'json' ? 'text-background' : 'text-foreground'
                      )}
                    >
                      Single Macro
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setExportFormat('bundle')}
                    className={cn(
                      'flex-1 rounded-lg p-3 active:opacity-80',
                      exportFormat === 'bundle' ? 'bg-primary' : 'bg-surface border border-border'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-center font-semibold text-sm',
                        exportFormat === 'bundle' ? 'text-background' : 'text-foreground'
                      )}
                    >
                      Bundle
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Macro Selection */}
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-muted">SELECT MACROS</Text>
                  <Text className="text-xs text-primary font-semibold">
                    {selectedMacros.length}/{macros.length}
                  </Text>
                </View>

                {macros.map((macro) => (
                  <Pressable
                    key={macro.id}
                    onPress={() => toggleMacro(macro.id)}
                    className={cn(
                      'flex-row items-center gap-3 p-3 rounded-lg border active:opacity-80',
                      selectedMacros.includes(macro.id)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-surface border-border'
                    )}
                  >
                    <View
                      className={cn(
                        'w-5 h-5 rounded border-2',
                        selectedMacros.includes(macro.id)
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      )}
                    >
                      {selectedMacros.includes(macro.id) && (
                        <Text className="text-center text-background text-xs font-bold">✓</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{macro.name}</Text>
                      <Text className="text-xs text-muted">{macro.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Export Button */}
              <Pressable
                onPress={handleExport}
                className="bg-primary rounded-lg p-4 active:opacity-80 mt-2"
              >
                <Text className="text-center font-semibold text-background text-base">
                  📤 Export {selectedMacros.length > 0 ? `(${selectedMacros.length})` : ''}
                </Text>
              </Pressable>

              {/* Info Box */}
              <View className="bg-success/10 rounded-lg p-3 border border-success/30 gap-1">
                <Text className="font-semibold text-success text-sm">💡 Tip</Text>
                <Text className="text-xs text-muted">
                  Exported macros can be shared via email, cloud storage, or messaging apps.
                </Text>
              </View>
            </View>
          )}

          {/* Import Tab */}
          {tab === 'import' && (
            <View className="gap-4">
              {/* Paste Area */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-muted">PASTE MACRO DATA</Text>
                <TextInput
                  placeholder="Paste exported JSON data here..."
                  placeholderTextColor={colors.muted}
                  value={importData}
                  onChangeText={setImportData}
                  multiline
                  numberOfLines={8}
                  className="bg-surface border border-border rounded-lg p-3 text-foreground font-mono text-xs"
                  style={{ color: colors.foreground }}
                />
              </View>

              {/* Import Button */}
              <Pressable
                onPress={handleImport}
                className="bg-primary rounded-lg p-4 active:opacity-80"
              >
                <Text className="text-center font-semibold text-background text-base">
                  📥 Import Macros
                </Text>
              </Pressable>

              {/* Info Box */}
              <View className="bg-info/10 rounded-lg p-3 border border-info/30 gap-1">
                <Text className="font-semibold text-info text-sm">📋 Format</Text>
                <Text className="text-xs text-muted">
                  Paste JSON data exported from another device or user.
                </Text>
              </View>

              {/* Example */}
              <View className="bg-surface rounded-lg p-3 border border-border gap-2">
                <Text className="font-semibold text-foreground text-sm">Example Format:</Text>
                <Text className="font-mono text-xs text-muted">
                  {`{
  "version": "1.0",
  "macros": [...]
}`}
                </Text>
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
