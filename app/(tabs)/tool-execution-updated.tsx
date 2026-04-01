import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useMCPBridge } from '@/lib/hooks/useMCPBridge';

/**
 * Updated Tool Execution Screen
 * Executes tools on connected MCP servers using the Kotlin bridge
 */
export default function ToolExecutionUpdatedScreen() {
  const colors = useColors();
  const { isReady, error, setError, executeTool } = useMCPBridge();

  // Form state
  const [formData, setFormData] = useState({
    serverId: '',
    toolName: '',
    parameters: {} as Record<string, any>,
  });

  const [parameterInputs, setParameterInputs] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle parameter input change
  const handleParameterChange = useCallback((key: string, value: string) => {
    setParameterInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Parse parameters
  const parseParameters = useCallback((): Record<string, any> => {
    const parsed: Record<string, any> = {};
    Object.entries(parameterInputs).forEach(([key, value]) => {
      try {
        // Try to parse as JSON first
        parsed[key] = JSON.parse(value);
      } catch {
        // Fall back to string
        parsed[key] = value;
      }
    });
    return parsed;
  }, [parameterInputs]);

  // Handle execute tool
  const handleExecuteTool = useCallback(async () => {
    if (!formData.serverId || !formData.toolName || !isReady) {
      Alert.alert('Error', 'Please fill in all required fields and ensure bridge is ready');
      return;
    }

    setIsExecuting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const parameters = parseParameters();
      const result = await executeTool(formData.serverId, formData.toolName, parameters);

      if (result) {
        setExecutionResult(result);
        Alert.alert('Success', 'Tool executed successfully');
      } else {
        Alert.alert('Error', 'Tool execution returned no result');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert('Execution Error', errorMsg);
    } finally {
      setIsExecuting(false);
    }
  }, [formData, isReady, parseParameters, executeTool, setError]);

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Execute Tool</Text>
          <Text className="text-sm text-muted">
            {isReady ? 'Bridge Ready' : 'Bridge Loading...'}
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="mb-4 p-3 bg-error rounded-lg">
            <Text className="text-sm text-background font-semibold">{error}</Text>
            <Pressable onPress={() => setError(null)} className="mt-2">
              <Text className="text-xs text-background underline">Dismiss</Text>
            </Pressable>
          </View>
        )}

        {/* Tool Selection Form */}
        <View className="mb-6 bg-surface rounded-lg p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">Tool Details</Text>

          {/* Server ID */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Server ID</Text>
            <TextInput
              placeholder="e.g., filesystem-server"
              placeholderTextColor={colors.muted}
              value={formData.serverId}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, serverId: text }))}
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              editable={!isExecuting}
            />
          </View>

          {/* Tool Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Tool Name</Text>
            <TextInput
              placeholder="e.g., read_file"
              placeholderTextColor={colors.muted}
              value={formData.toolName}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, toolName: text }))}
              className="bg-background text-foreground p-3 rounded-lg border border-border"
              editable={!isExecuting}
            />
          </View>
        </View>

        {/* Parameters Form */}
        {formData.toolName && (
          <View className="mb-6 bg-surface rounded-lg p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Parameters</Text>

            {/* Example: path parameter */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">path</Text>
              <TextInput
                placeholder="/path/to/file"
                placeholderTextColor={colors.muted}
                value={parameterInputs.path || ''}
                onChangeText={(text) => handleParameterChange('path', text)}
                className="bg-background text-foreground p-3 rounded-lg border border-border"
                editable={!isExecuting}
              />
              <Text className="text-xs text-muted mt-1">File path to read</Text>
            </View>

            {/* Advanced Options */}
            <Pressable
              onPress={() => setShowAdvanced(!showAdvanced)}
              className="mb-4"
            >
              <Text className="text-sm font-medium text-primary">
                {showAdvanced ? '▼ Hide Advanced' : '▶ Show Advanced'}
              </Text>
            </Pressable>

            {showAdvanced && (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-medium text-foreground mb-2">Custom JSON</Text>
                  <TextInput
                    placeholder='{"key": "value"}'
                    placeholderTextColor={colors.muted}
                    value={parameterInputs.custom || ''}
                    onChangeText={(text) => handleParameterChange('custom', text)}
                    className="bg-background text-foreground p-3 rounded-lg border border-border"
                    multiline
                    numberOfLines={4}
                    editable={!isExecuting}
                  />
                  <Text className="text-xs text-muted mt-1">Raw JSON parameters</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Execute Button */}
        <Pressable
          onPress={handleExecuteTool}
          disabled={isExecuting || !isReady || !formData.serverId || !formData.toolName}
          className={cn(
            'p-4 rounded-lg items-center justify-center mb-6',
            isExecuting || !isReady || !formData.serverId || !formData.toolName
              ? 'bg-muted'
              : 'bg-primary'
          )}
        >
          {isExecuting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text className="text-base font-semibold text-background">Execute Tool</Text>
          )}
        </Pressable>

        {/* Execution Result */}
        {executionResult && (
          <View className="p-4 bg-surface rounded-lg border border-success">
            <Text className="text-lg font-semibold text-foreground mb-4">Result</Text>
            <Text className="text-sm text-foreground font-mono">
              {typeof executionResult === 'string'
                ? executionResult
                : JSON.stringify(executionResult, null, 2)}
            </Text>
            <Pressable
              onPress={() => {
                setExecutionResult(null);
                setFormData({ serverId: '', toolName: '', parameters: {} });
                setParameterInputs({});
              }}
              className="mt-4 p-2 bg-primary rounded"
            >
              <Text className="text-sm font-medium text-background text-center">Clear</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
