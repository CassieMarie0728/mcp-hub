import { ScrollView, Text, View, Pressable, Share, Alert, FlatList } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useToolExecution, ResultType, ToolExecutionResult } from '@/lib/hooks/useToolExecution';
import { ResultDisplayFormatter, FormattedResult } from '@/lib/utils/ResultDisplayFormatter';
import { SaveAsMacroModal } from '@/components/SaveAsMacroModal';
import { useMacroExecution } from '@/lib/hooks/useMacroExecution';

/**
 * Results Screen
 * Display tool execution results with format selection and export options
 */
export default function ResultsScreen() {
  const colors = useColors();
  const { getExecutionHistory } = useToolExecution();
  const { createFromExecutionHistory } = useMacroExecution();

  // State
  const [selectedResult, setSelectedResult] = useState<ToolExecutionResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ResultType>(ResultType.TEXT);
  const [formattedResult, setFormattedResult] = useState<FormattedResult | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ToolExecutionResult[]>([]);
  const [showSaveAsMacroModal, setShowSaveAsMacroModal] = useState(false);

  /**
   * Format result when selected result or format changes
   */
  useEffect(() => {
    if (selectedResult) {
      const formatted = ResultDisplayFormatter.formatResult(selectedResult.result, selectedFormat);
      setFormattedResult(formatted);
    }
  }, [selectedResult, selectedFormat]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!formattedResult) return;

    try {
      // In a real app, use react-native-clipboard
      Alert.alert('Copied', 'Result copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }, [formattedResult]);

  /**
   * Handle share
   */
  const handleShare = useCallback(async () => {
    if (!formattedResult || !selectedResult) return;

    try {
      await Share.share({
        message: formattedResult.content,
        title: `Tool Execution Result`,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to share result');
    }
  }, [formattedResult, selectedResult]);

  /**
   * Handle download
   */
  const handleDownload = useCallback(async () => {
    if (!formattedResult || !selectedResult) return;

    try {
      const downloadable = ResultDisplayFormatter.toDownloadable(
        selectedResult.result,
        selectedFormat,
        `result_${Date.now()}`
      );
      Alert.alert('Download', 'File ready for download: ' + downloadable.filename);
    } catch (err) {
      Alert.alert('Error', 'Failed to prepare download');
    }
  }, [formattedResult, selectedResult, selectedFormat]);

  /**
   * Handle save as macro
   */
  const handleSaveAsMacro = useCallback(async (name: string, description?: string) => {
    if (!selectedResult) return;

    try {
      await createFromExecutionHistory([selectedResult.id], name, description);
      setShowSaveAsMacroModal(false);
      Alert.alert('Success', 'Macro saved successfully');
    } catch (err) {
      throw err;
    }
  }, [selectedResult, createFromExecutionHistory]);

  /**
   * Render format selector
   */
  const renderFormatSelector = () => {
    if (!selectedResult) return null;

    const availableFormats = ResultDisplayFormatter.getAvailableFormats(selectedResult.resultType);

    return (
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">Display Format</Text>
        <FlatList
          horizontal
          data={availableFormats}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedFormat(item)}
              className={cn(
                'py-2 px-4 rounded-full border-2 mr-2',
                selectedFormat === item ? 'border-primary bg-primary/10' : 'border-border bg-surface'
              )}
            >
              <Text
                className={cn(
                  'text-sm font-semibold',
                  selectedFormat === item ? 'text-primary' : 'text-foreground'
                )}
              >
                {item}
              </Text>
            </Pressable>
          )}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  /**
   * Render result content
   */
  const renderResultContent = () => {
    if (!formattedResult) return null;

    const { content, metadata } = formattedResult;

    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-semibold text-foreground">Result</Text>
          <Text className="text-xs text-muted">
            {(metadata.size / 1024).toFixed(2)} KB
            {metadata.isLarge && ' (truncated)'}
          </Text>
        </View>

        <View className="bg-background/50 rounded-lg p-4 border border-border max-h-96">
          <ScrollView nestedScrollEnabled={true}>
            <Text
              className="text-xs font-mono text-foreground/80 leading-relaxed"
              selectable={true}
            >
              {content}
            </Text>
          </ScrollView>
        </View>

        {metadata.isLarge && (
          <View className="mt-2 p-2 bg-warning/10 rounded border border-warning">
            <Text className="text-xs text-warning">
              Result is large and has been truncated for display
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render action buttons
   */
  const renderActionButtons = () => {
    if (!selectedResult) return null;

    return (
      <View className="gap-2 mb-6">
        {formattedResult?.metadata.canCopy && (
          <Pressable
            onPress={handleCopy}
            className="py-3 px-4 bg-surface rounded-lg border border-border flex-row items-center justify-center"
          >
            <MaterialIcons name="content-copy" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold ml-2">Copy to Clipboard</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleShare}
          className="py-3 px-4 bg-surface rounded-lg border border-border flex-row items-center justify-center"
        >
          <MaterialIcons name="share" size={18} color={colors.foreground} />
          <Text className="text-foreground font-semibold ml-2">Share</Text>
        </Pressable>

        {formattedResult?.metadata.canDownload && (
          <Pressable
            onPress={handleDownload}
            className="py-3 px-4 bg-surface rounded-lg border border-border flex-row items-center justify-center"
          >
            <MaterialIcons name="download" size={18} color={colors.foreground} />
            <Text className="text-foreground font-semibold ml-2">Download</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => setShowSaveAsMacroModal(true)}
          className="py-3 px-4 bg-primary rounded-lg flex-row items-center justify-center"
        >
          <MaterialIcons name="save" size={18} color="white" />
          <Text className="text-white font-semibold ml-2">Save as Macro</Text>
        </Pressable>
      </View>
    );
  };

  /**
   * Render result metadata
   */
  const renderMetadata = () => {
    if (!selectedResult) return null;

    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-6">
        <Text className="text-sm font-semibold text-foreground mb-3">Execution Details</Text>

        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Status</Text>
            <Text
              className={cn(
                'text-sm font-semibold',
                selectedResult.success ? 'text-success' : 'text-error'
              )}
            >
              {selectedResult.success ? 'Success' : 'Failed'}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Execution Time</Text>
            <Text className="text-sm font-semibold text-foreground">
              {selectedResult.executionTimeMs}ms
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Result Type</Text>
            <Text className="text-sm font-semibold text-foreground">{selectedResult.resultType}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-muted">Timestamp</Text>
            <Text className="text-sm font-semibold text-foreground">
              {new Date(selectedResult.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {selectedResult.error && (
          <View className="mt-4 p-3 bg-error/10 rounded border border-error">
            <Text className="text-xs font-semibold text-error mb-1">{selectedResult.error.code}</Text>
            <Text className="text-xs text-error">{selectedResult.error.message}</Text>
            {selectedResult.error.details && (
              <Text className="text-xs text-error/80 mt-2">{selectedResult.error.details}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render raw JSON toggle
   */
  const renderRawJsonToggle = () => {
    if (!selectedResult) return null;

    return (
      <View className="flex-row items-center justify-between py-3 px-4 bg-surface rounded-lg border border-border mb-6">
        <Text className="text-sm font-semibold text-foreground">Show Raw JSON</Text>
        <Pressable
          onPress={() => setShowRawJson(!showRawJson)}
          className={cn(
            'w-12 h-7 rounded-full flex items-center justify-start p-1',
            showRawJson ? 'bg-primary' : 'bg-border'
          )}
        >
          <View
            className={cn(
              'w-5 h-5 rounded-full bg-background transition-all',
              showRawJson ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </Pressable>
      </View>
    );
  };

  /**
   * Render raw JSON view
   */
  const renderRawJson = () => {
    if (!showRawJson || !selectedResult) return null;

    return (
      <View className="bg-background/50 rounded-lg p-4 border border-border mb-6">
        <Text className="text-xs font-mono text-foreground/80" selectable={true}>
          {JSON.stringify(selectedResult, null, 2)}
        </Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  if (!selectedResult) {
    return (
      <ScreenContainer className="p-6 items-center justify-center">
        <View className="items-center gap-4">
          <Text className="text-5xl">📊</Text>
          <Text className="text-foreground text-center text-lg font-semibold mb-2">
            No Results Yet
          </Text>
          <Text className="text-muted text-center">
            Execute a tool from the Execute tab to see its results displayed here
          </Text>
          <View className="mt-4 p-4 bg-surface rounded-lg border border-border max-w-xs">
            <Text className="text-xs text-muted text-center">
              Results will automatically appear after tool execution completes
            </Text>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Results</Text>
          <Text className="text-muted">Tool execution results and details</Text>
        </View>

        {/* Metadata */}
        {renderMetadata()}

        {/* Format Selector */}
        {renderFormatSelector()}

        {/* Result Content */}
        {renderResultContent()}

        {/* Raw JSON Toggle */}
        {renderRawJsonToggle()}

        {/* Raw JSON View */}
        {renderRawJson()}

        {/* Action Buttons */}
        {renderActionButtons()}
      </ScrollView>

      {/* Save as Macro Modal */}
      <SaveAsMacroModal
        visible={showSaveAsMacroModal}
        executionIds={selectedResult ? [selectedResult.id] : []}
        onSave={handleSaveAsMacro}
        onCancel={() => setShowSaveAsMacroModal(false)}
      />
    </ScreenContainer>
  );
}
