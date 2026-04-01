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
import { useState, useCallback, useMemo } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { useToolExecution, ResultType } from '@/lib/hooks/useToolExecution';
import { useToolDiscovery, JsonSchema, ToolSchema } from '@/lib/hooks/useToolDiscovery';

/**
 * Tool Execution Screen
 * Execute tools with dynamic form builder based on JSON schema
 */
export default function ToolExecutionScreen() {
  const colors = useColors();
  const { executeTool, validateParameters, isAnyExecuting } = useToolExecution();
  const { getTool } = useToolDiscovery();

  // State
  const [serverId, setServerId] = useState<string>('');
  const [toolName, setToolName] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [timeoutMs, setTimeoutMs] = useState(60000);
  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Get current tool schema
   */
  const currentTool = useMemo(() => {
    if (!serverId || !toolName) return null;
    return getTool(serverId, toolName);
  }, [serverId, toolName, getTool]);

  /**
   * Handle parameter change
   */
  const handleParameterChange = useCallback(
    (paramName: string, value: any) => {
      setParameters((prev) => ({
        ...prev,
        [paramName]: value,
      }));
      // Clear validation error for this parameter
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[paramName];
        return updated;
      });
    },
    []
  );

  /**
   * Handle execute button press
   */
  const handleExecute = useCallback(async () => {
    if (!serverId || !toolName) {
      Alert.alert('Error', 'Please select a server and tool');
      return;
    }

    // Validate parameters
    const validation = await validateParameters(serverId, toolName, parameters);
    if (!validation.isValid) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        const match = error.match(/Parameter (\w+)/);
        if (match) {
          errors[match[1]] = error;
        }
      });
      setValidationErrors(errors);
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeTool(serverId, toolName, parameters, timeoutMs);

      if (result.success) {
        Alert.alert('Success', 'Tool executed successfully');
        // Navigate to results screen or show results here
      } else {
        Alert.alert('Execution Failed', result.error?.message || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  }, [serverId, toolName, parameters, timeoutMs, validateParameters, executeTool]);

  /**
   * Render parameter input based on schema type
   */
  const renderParameterInput = (
    paramName: string,
    schema: JsonSchema,
    isRequired: boolean
  ): React.ReactNode => {
    const value = parameters[paramName];
    const error = validationErrors[paramName];

    switch (schema.type) {
      case 'string':
        return (
          <View key={paramName} className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground">
                {paramName}
                {isRequired && <Text className="text-error">*</Text>}
              </Text>
              {schema.description && (
                <Text className="text-xs text-muted">{schema.description}</Text>
              )}
            </View>
            <TextInput
              className={cn(
                'px-4 py-3 rounded-lg border text-foreground',
                error ? 'border-error bg-error/10' : 'border-border bg-surface'
              )}
              placeholder={schema.description || `Enter ${paramName}`}
              placeholderTextColor={colors.muted}
              value={String(value || '')}
              onChangeText={(text) => handleParameterChange(paramName, text)}
              editable={!isExecuting}
              multiline={schema.format === 'textarea'}
              numberOfLines={schema.format === 'textarea' ? 4 : 1}
            />
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </View>
        );

      case 'number':
      case 'integer':
        return (
          <View key={paramName} className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground">
                {paramName}
                {isRequired && <Text className="text-error">*</Text>}
              </Text>
              {schema.minimum !== undefined && schema.maximum !== undefined && (
                <Text className="text-xs text-muted">
                  {schema.minimum}-{schema.maximum}
                </Text>
              )}
            </View>
            <TextInput
              className={cn(
                'px-4 py-3 rounded-lg border text-foreground',
                error ? 'border-error bg-error/10' : 'border-border bg-surface'
              )}
              placeholder={`Enter ${paramName}`}
              placeholderTextColor={colors.muted}
              value={String(value || '')}
              onChangeText={(text) =>
                handleParameterChange(paramName, schema.type === 'integer' ? parseInt(text) : parseFloat(text))
              }
              keyboardType="decimal-pad"
              editable={!isExecuting}
            />
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </View>
        );

      case 'boolean':
        return (
          <View key={paramName} className="mb-4 flex-row items-center justify-between py-3">
            <Text className="text-sm font-semibold text-foreground">
              {paramName}
              {isRequired && <Text className="text-error">*</Text>}
            </Text>
            <Switch
              value={value || false}
              onValueChange={(newValue) => handleParameterChange(paramName, newValue)}
              disabled={isExecuting}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        );

      case 'array':
        return (
          <View key={paramName} className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {paramName}
              {isRequired && <Text className="text-error">*</Text>}
            </Text>
            <TextInput
              className={cn(
                'px-4 py-3 rounded-lg border text-foreground',
                error ? 'border-error bg-error/10' : 'border-border bg-surface'
              )}
              placeholder="Enter comma-separated values"
              placeholderTextColor={colors.muted}
              value={Array.isArray(value) ? value.join(', ') : ''}
              onChangeText={(text) =>
                handleParameterChange(paramName, text.split(',').map((s) => s.trim()))
              }
              editable={!isExecuting}
            />
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </View>
        );

      default:
        return (
          <View key={paramName} className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {paramName}
              {isRequired && <Text className="text-error">*</Text>}
            </Text>
            <TextInput
              className={cn(
                'px-4 py-3 rounded-lg border text-foreground',
                error ? 'border-error bg-error/10' : 'border-border bg-surface'
              )}
              placeholder={`Enter ${paramName}`}
              placeholderTextColor={colors.muted}
              value={String(value || '')}
              onChangeText={(text) => handleParameterChange(paramName, text)}
              editable={!isExecuting}
            />
            {error && <Text className="text-xs text-error mt-1">{error}</Text>}
          </View>
        );
    }
  };

  /**
   * Render parameter form
   */
  const renderParameterForm = () => {
    if (!currentTool) {
      return (
        <View className="py-8 items-center">
          <Text className="text-muted text-center">Select a tool to see its parameters</Text>
        </View>
      );
    }

    const schema = currentTool.inputSchema;
    const requiredParams = schema.required || [];
    const properties = schema.properties || {};

    if (Object.keys(properties).length === 0) {
      return (
        <View className="py-4">
          <Text className="text-muted text-center">This tool has no parameters</Text>
        </View>
      );
    }

    return (
      <View>
        {Object.entries(properties).map(([paramName, paramSchema]) =>
          renderParameterInput(paramName, paramSchema, requiredParams.includes(paramName))
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Execute Tool</Text>
          <Text className="text-muted">Run tools with custom parameters</Text>
        </View>

        {/* Tool Selection */}
        <View className="bg-surface rounded-lg p-6 border border-border mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Server ID</Text>
          <TextInput
            className="px-4 py-3 rounded-lg border border-border bg-background text-foreground mb-4"
            placeholder="Enter server ID"
            placeholderTextColor={colors.muted}
            value={serverId}
            onChangeText={setServerId}
            editable={!isExecuting}
          />

          <Text className="text-sm font-semibold text-foreground mb-2">Tool Name</Text>
          <TextInput
            className="px-4 py-3 rounded-lg border border-border bg-background text-foreground mb-4"
            placeholder="Enter tool name"
            placeholderTextColor={colors.muted}
            value={toolName}
            onChangeText={setToolName}
            editable={!isExecuting}
          />

          <Text className="text-sm font-semibold text-foreground mb-2">Timeout (ms)</Text>
          <TextInput
            className="px-4 py-3 rounded-lg border border-border bg-background text-foreground"
            placeholder="60000"
            placeholderTextColor={colors.muted}
            value={String(timeoutMs)}
            onChangeText={(text) => setTimeoutMs(parseInt(text) || 60000)}
            keyboardType="numeric"
            editable={!isExecuting}
          />
        </View>

        {/* Parameters Form */}
        {currentTool && (
          <View className="bg-surface rounded-lg p-6 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">Parameters</Text>
            {renderParameterForm()}
          </View>
        )}

        {/* Execute Button */}
        <Pressable
          onPress={handleExecute}
          disabled={isExecuting || !serverId || !toolName}
          className={cn(
            'py-4 px-6 rounded-lg flex-row items-center justify-center',
            isExecuting || !serverId || !toolName ? 'bg-primary/50' : 'bg-primary'
          )}
        >
          {isExecuting ? (
            <>
              <ActivityIndicator color={colors.background} size="small" />
              <Text className="text-background font-semibold ml-2">Executing...</Text>
            </>
          ) : (
            <Text className="text-background font-semibold">Execute Tool</Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
