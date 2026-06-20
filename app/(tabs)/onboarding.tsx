import { ScrollView, Text, View, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function OnboardingScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to the control room",
      description: "MCP Hub pulls your tools, servers, and automations into one place so you can stop chasing the mess across tabs.",
      action: "Start Setup",
    },
    {
      title: "Pick your first server",
      description: "Choose the platform or MCP endpoint you want to connect first. Start with the one that matters most.",
      action: "Continue",
    },
    {
      title: "Connect the account",
      description: "Add the required credentials and keep them protected. No casual handling, no loose ends.",
      action: "Connect",
    },
    {
      title: "Build a workflow",
      description: "Chain actions together so your tools can do useful work instead of sitting around looking decorative.",
      action: "Create",
    },
    {
      title: "Test before you trust it",
      description: "Run a preview, check the output, and make sure the workflow behaves before it touches anything important.",
      action: "Test",
    },
    {
      title: "You are wired in",
      description: "Start running tools, watching history, and shaping the system into something that works your way.",
      action: "Enter Hub",
    },
  ];

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          <View className="gap-2">
            <View className="h-2 bg-surface rounded-full overflow-hidden">
              <View className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </View>
            <Text className="text-xs text-muted text-center">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          <View className="flex-1 gap-6 justify-center">
            <View className="gap-4">
              <Text className="text-4xl font-bold text-foreground">{step.title}</Text>
              <Text className="text-lg text-muted leading-relaxed">{step.description}</Text>
            </View>

            <View className="bg-surface rounded-2xl p-4 gap-2 border border-border">
              <Text className="text-sm font-semibold text-foreground">Operator note</Text>
              <Text className="text-sm text-muted leading-relaxed">
                {currentStep === 0 && "Start small. One server, one clean connection, one useful win."}
                {currentStep === 1 && "You can add more later. The first connection is about proving the path works."}
                {currentStep === 2 && "Credentials should stay protected and easy to rotate when needed."}
                {currentStep === 3 && "Simple workflows are easier to trust, debug, and improve."}
                {currentStep === 4 && "A dry run is not busywork. It is how you avoid surprise chaos."}
                {currentStep === 5 && "Once the basics work, make it sharper, faster, and more yours."}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => currentStep < steps.length - 1 && setCurrentStep(currentStep + 1)}
              style={({ pressed }) => [{ backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              className="py-4 rounded-full items-center"
            >
              <Text className="text-background font-semibold text-lg">{step.action}</Text>
            </Pressable>

            {currentStep > 0 && (
              <Pressable onPress={() => setCurrentStep(currentStep - 1)} className="py-3 items-center">
                <Text className="text-primary font-semibold">Back</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setCurrentStep(steps.length - 1)} className="py-3 items-center">
              <Text className="text-muted text-sm">Skip setup</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
