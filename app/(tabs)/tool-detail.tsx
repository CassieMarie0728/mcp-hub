import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { JSONSchema } from '@/lib/types';
import { useMCPService } from '@/hooks/use-mcp-service';

export default function ToolDetailScreen() {
  const navigation = useNavigation();
  const { serverId, toolName } = useLocalSearchParams();
  const { servers, getServerTools, addExecutionResult } = useApp();
  const { executeTool } = useMCPService();
  const router = useRouter();
  const colors = useColors();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Tool Details',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
      },
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <MaterialIcons name="build" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const server = servers.find((s) => s.id === serverId);
  const tools = server ? getServerTools(server.id) : [];
  const tool = tools.find((t) => t.name === toolName);

  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!server || !tool) {
    return (
      <ScreenContainer className="p-0 items-center justify-center">
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text className="text-foreground font-semibold mt-4">Tool Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const handleExecute = async () => {
    // Validate required parameters
    const required = tool.inputSchema.required || [];
    const missing = required.filter((param) => !parameters[param]);

    if (missing.length > 0) {
      Alert.alert(
        'Missing Parameters',
        `Please fill in: ${missing.join(', ')}`
      );
      return;
    }

    setIsExecuting(true);
    try {
      const executionResult = await executeTool(
        serverId as string,
        toolName as string,
        parameters
      );

      // Ensure executionResult has an id
      if (!executionResult.id) {
        executionResult.id = `result-${Date.now()}`;
      }
      await addExecutionResult(executionResult);
      setResult(executionResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to execute tool');
      console.error('Tool execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const renderParameterInput = (paramName: string, schema: JSONSchema) => {
    const isRequired = (tool.inputSchema.required || []).includes(paramName);

    return (
      <View key={paramName} className="mb-4">
        <View className="flex-row items-center gap-1 mb-2">
          <Text className="text-sm font-semibold text-foreground">{paramName}</Text>
          {isRequired && <Text className="text-error">*</Text>}
        </View>
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
          placeholder={schema.description || `Enter ${paramName}`}
          placeholderTextColor={colors.muted}
          value={parameters[paramName] || ''}
          onChangeText={(value) =>
            setParameters((prev) => ({ ...prev, [paramName]: value }))
          }
          editable={!isExecuting}
          multiline={schema.type === 'string' && !schema.enum}
          numberOfLines={schema.type === 'string' ? 3 : 1}
        />
        {schema.description && (
          <Text className="text-xs text-muted mt-1">{schema.description}</Text>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-primary px-6 pt-6 pb-6 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={24} color={colors.background} />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-2xl font-bold text-background">{tool.name}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Tool Description */}
        <View className="mb-6 bg-surface rounded-lg p-4 border border-border">
          <Text className="text-foreground font-semibold mb-2">Description</Text>
          <Text className="text-sm text-muted">{tool.description}</Text>
        </View>

        {/* Parameters */}
        {Object.keys(tool.inputSchema.properties || {}).length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">Parameters</Text>
            {Object.entries(tool.inputSchema.properties || {}).map(
              ([paramName, schema]) =>
                renderParameterInput(paramName, schema as JSONSchema)
            )}
          </View>
        )}

        {/* Execute Button */}
        <TouchableOpacity
          onPress={handleExecute}
          disabled={isExecuting}
          className={`rounded-lg py-4 items-center justify-center flex-row gap-2 mb-6 ${
            isExecuting ? 'bg-primary/50' : 'bg-primary'
          }`}
        >
          {isExecuting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <MaterialIcons name="play-arrow" size={20} color={colors.background} />
              <Text className="text-background font-semibold">Execute Tool</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View className="mb-6 bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-3">
              <MaterialIcons
                name={result.isError ? 'error' : 'check-circle'}
                size={20}
                color={result.isError ? colors.error : colors.success}
              />
              <Text className="text-foreground font-semibold">
                {result.isError ? 'Error' : 'Success'}
              </Text>
            </View>
            <Text className="text-sm text-muted font-mono">
              {JSON.stringify(result, null, 2)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Copied', 'Result copied to clipboard');
              }}
              className="mt-3 flex-row items-center justify-center gap-2 py-2 border border-border rounded-lg"
            >
              <MaterialIcons name="content-copy" size={16} color={colors.primary} />
              <Text className="text-sm text-primary font-semibold">Copy Result</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
