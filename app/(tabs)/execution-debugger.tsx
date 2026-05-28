import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

export default function ExecutionDebuggerScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [showVariables, setShowVariables] = useState(false);

  const execution = {
    id: 'exec-123',
    workflow: 'GitHub → Slack',
    status: 'completed',
    steps: [
      {
        id: 'step-1',
        name: 'Fetch GitHub Issues',
        duration: 245,
        status: 'completed',
        input: { repo: 'user/repo' },
        output: { issues: 5 },
        variables: { issues: [{ id: 1, title: 'Bug' }] },
      },
      {
        id: 'step-2',
        name: 'Filter Issues',
        duration: 120,
        status: 'completed',
        input: { issues: 5 },
        output: { filtered: 2 },
        variables: { filtered: [{ id: 1, title: 'Bug' }] },
      },
      {
        id: 'step-3',
        name: 'Send Slack Message',
        duration: 450,
        status: 'completed',
        input: { message: 'Found 2 issues' },
        output: { messageId: 'msg-123' },
        variables: { messageId: 'msg-123' },
      },
    ],
  };

  const step = execution.steps[currentStep];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Execution Debugger</Text>
            <Text className="text-sm text-muted">{execution.workflow}</Text>
          </View>

          {/* Step Navigation */}
          <View className="gap-3">
            {execution.steps.map((s, index) => (
              <Pressable
                key={s.id}
                onPress={() => setCurrentStep(index)}
                style={({ pressed }) => [
                  {
                    backgroundColor: index === currentStep ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="p-4 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text
                    className={`font-semibold ${index === currentStep ? 'text-background' : 'text-foreground'}`}
                  >
                    {s.name}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${index === currentStep ? 'text-background/70' : 'text-muted'}`}
                  >
                    {s.duration}ms
                  </Text>
                </View>
                <Text
                  className={`text-lg ${index === currentStep ? 'text-background' : 'text-success'}`}
                >
                  ✓
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Step Details */}
          <View className="gap-4 bg-surface rounded-2xl p-4">
            <Text className="text-lg font-bold text-foreground">{step.name}</Text>

            {/* Input/Output */}
            <View className="gap-3">
              <View>
                <Text className="text-sm font-semibold text-muted mb-2">Input</Text>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded">
                  {JSON.stringify(step.input, null, 2)}
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-muted mb-2">Output</Text>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded">
                  {JSON.stringify(step.output, null, 2)}
                </Text>
              </View>
            </View>

            {/* Variables Toggle */}
            <Pressable
              onPress={() => setShowVariables(!showVariables)}
              className="py-2 px-3 bg-background rounded-lg flex-row items-center justify-between"
            >
              <Text className="text-sm font-semibold text-foreground">Variables</Text>
              <Text className="text-primary">{showVariables ? '▼' : '▶'}</Text>
            </Pressable>

            {showVariables && (
              <View>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded">
                  {JSON.stringify(step.variables, null, 2)}
                </Text>
              </View>
            )}
          </View>

          {/* Navigation */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
              className="flex-1 py-3 rounded-full items-center border border-primary"
            >
              <Text className="text-primary font-semibold">Previous</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                currentStep < execution.steps.length - 1 && setCurrentStep(currentStep + 1)
              }
              style={{ backgroundColor: colors.primary }}
              className="flex-1 py-3 rounded-full items-center"
            >
              <Text className="text-background font-semibold">Next</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
