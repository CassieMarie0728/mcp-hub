import { ScrollView, Text, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

export default function OnboardingScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to MCP Hub',
      description: 'Automate your workflow across GitHub, Slack, and Notion',
      action: 'Get Started',
    },
    {
      title: 'Select a Server',
      description: 'Choose which platform you want to connect first',
      action: 'Continue',
    },
    {
      title: 'Connect Your Account',
      description: 'Authenticate securely with OAuth',
      action: 'Authenticate',
    },
    {
      title: 'Create Your First Workflow',
      description: 'Build a simple automation to get started',
      action: 'Create',
    },
    {
      title: 'Test Your Workflow',
      description: 'Run a dry-run to preview execution',
      action: 'Test',
    },
    {
      title: "You're All Set!",
      description: 'Start automating your work',
      action: 'Start',
    },
  ];

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Progress Bar */}
          <View className="gap-2">
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </View>
            <Text className="text-xs text-muted text-center">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1 gap-6 justify-center">
            <View className="gap-4">
              <Text className="text-4xl font-bold text-foreground">{step.title}</Text>
              <Text className="text-lg text-muted leading-relaxed">{step.description}</Text>
            </View>

            {/* Tips */}
            <View className="bg-surface rounded-2xl p-4 gap-2">
              <Text className="text-sm font-semibold text-foreground">💡 Tip</Text>
              <Text className="text-sm text-muted">
                {currentStep === 0 &&
                  'MCP Hub lets you automate tasks across multiple platforms without writing code.'}
                {currentStep === 1 &&
                  'You can connect multiple servers and create workflows that span across them.'}
                {currentStep === 2 &&
                  'Your credentials are encrypted and never stored in plain text.'}
                {currentStep === 3 && 'Start simple with a single action, then build from there.'}
                {currentStep === 4 && 'Dry-run shows you exactly what will happen before it runs.'}
                {currentStep === 5 &&
                  'You can create unlimited workflows and manage them all from one place.'}
              </Text>
            </View>
          </View>

          {/* Navigation */}
          <View className="gap-3">
            <Pressable
              onPress={() => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1)}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="py-4 rounded-full items-center"
            >
              <Text className="text-background font-semibold text-lg">{step.action}</Text>
            </Pressable>

            {currentStep > 0 && (
              <Pressable
                onPress={() => setCurrentStep(currentStep - 1)}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                className="py-3 items-center"
              >
                <Text className="text-primary font-semibold">Back</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setCurrentStep(steps.length - 1)}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
              className="py-3 items-center"
            >
              <Text className="text-muted text-sm">Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
