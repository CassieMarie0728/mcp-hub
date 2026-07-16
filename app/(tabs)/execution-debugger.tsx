import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

export default function ExecutionDebuggerScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);
  const [showVariables, setShowVariables] = useState(false);

  const execution = {
    id: 'example-run',
    workflow: 'Example workflow run',
    status: 'completed',
    steps: [
      {
        id: 'step-1',
        name: 'Collect source items',
        duration: 245,
        status: 'completed',
        input: { source: 'connected server' },
        output: { itemsFound: 5 },
        variables: { items: [{ id: 1, title: 'Example item' }] },
      },
      {
        id: 'step-2',
        name: 'Filter useful results',
        duration: 120,
        status: 'completed',
        input: { itemsFound: 5 },
        output: { kept: 2 },
        variables: { kept: [{ id: 1, title: 'Example item' }] },
      },
      {
        id: 'step-3',
        name: 'Send final update',
        duration: 450,
        status: 'completed',
        input: { summary: '2 items need review' },
        output: { updateId: 'example-update' },
        variables: { updateId: 'example-update' },
      },
    ],
  };

  const step = execution.steps[currentStep];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <View className="gap-2 bg-primary rounded-2xl p-5">
            <Text className="text-xs font-bold tracking-widest text-background/70">DEBUG RUN</Text>
            <Text className="text-3xl font-bold text-background">Follow the trail</Text>
            <Text className="text-sm text-background/80 leading-relaxed">
              Inspect each step, compare inputs and outputs, and find where the workflow changed
              shape.
            </Text>
          </View>

          <View className="gap-3">
            {execution.steps.map((s, index) => (
              <Pressable
                key={s.id}
                onPress={() => setCurrentStep(index)}
                style={({ pressed }) => [
                  {
                    backgroundColor: index === currentStep ? colors.primary : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                    borderColor: colors.border,
                    borderWidth: 1,
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

          <View className="gap-4 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground">{step.name}</Text>
            <Text className="text-xs text-muted">{execution.workflow}</Text>

            <View className="gap-3">
              <View>
                <Text className="text-sm font-semibold text-muted mb-2">Input</Text>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded border border-border">
                  {JSON.stringify(step.input, null, 2)}
                </Text>
              </View>

              <View>
                <Text className="text-sm font-semibold text-muted mb-2">Output</Text>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded border border-border">
                  {JSON.stringify(step.output, null, 2)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowVariables(!showVariables)}
              className="py-2 px-3 bg-background rounded-lg flex-row items-center justify-between border border-border"
            >
              <Text className="text-sm font-semibold text-foreground">Step variables</Text>
              <Text className="text-primary">{showVariables ? '▼' : '▶'}</Text>
            </Pressable>

            {showVariables && (
              <View>
                <Text className="text-xs text-foreground font-mono bg-background p-2 rounded border border-border">
                  {JSON.stringify(step.variables, null, 2)}
                </Text>
              </View>
            )}
          </View>

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
