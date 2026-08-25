import React from 'react';
import { View, Text, ScrollView, Pressable, Modal, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useOnboarding } from '@/lib/onboarding-context';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ICON_MAP: Record<string, string> = {
  'rocket': 'rocket',
  'server': 'server',
  'flash': 'flash',
  'history': 'history',
  'sparkles': 'sparkles',
  'layers': 'layers',
  'shopping-bag': 'shopping-bag',
  'settings': 'settings',
};

export function OnboardingModal() {
  const {
    isOnboarding,
    currentStepIndex,
    stepData,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding();
  const colors = useColors();
  const { height } = Dimensions.get('window');

  if (!isOnboarding) {
    return null;
  }

  const isLastStep = currentStepIndex === 7; // 0-indexed, so 7 is the last step
  const isFirstStep = currentStepIndex === 0;
  const progressPercent = ((currentStepIndex + 1) / 8) * 100;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <Modal
      visible={isOnboarding}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View
        className="flex-1 bg-black/50 justify-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        {/* Onboarding Card */}
        <View
          className="bg-background rounded-t-3xl overflow-hidden"
          style={{
            maxHeight: height * 0.85,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Close Button */}
            <View className="flex-row items-center justify-between p-6 border-b border-border">
              <Text className="text-lg font-bold text-foreground flex-1">
                Step {currentStepIndex + 1} of 8
              </Text>
              <Pressable
                onPress={skipOnboarding}
                className="p-2 active:opacity-70"
              >
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View className="px-6 pt-4 pb-2">
              <View className="h-1 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </View>
            </View>

            {/* Intro uses the MCP core; later steps retain their functional icon. */}
            <View className="items-center pt-6 pb-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                {currentStepIndex === 0 ? (
                  <Image
                    source={require('../assets/images/icon.png')}
                    resizeMode="cover"
                    accessibilityLabel="MCP Hub reactor core"
                    style={{ width: 72, height: 72, borderRadius: 36 }}
                  />
                ) : (
                  <MaterialIcons
                    name={ICON_MAP[stepData.icon] as any}
                    size={40}
                    color={colors.primary}
                  />
                )}
              </View>
            </View>

            {/* Title and Description */}
            <View className="px-6 pb-4">
              <Text className="text-2xl font-bold text-foreground mb-3 text-center">
                {stepData.title}
              </Text>
              <Text className="text-base text-muted text-center leading-relaxed">
                {stepData.description}
              </Text>
            </View>

            {/* Tips Section */}
            <View className="px-6 pb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                💡 Quick Tips
              </Text>
              <View className="gap-2">
                {stepData.tips.map((tip, index) => (
                  <View key={index} className="flex-row gap-3 items-start">
                    <View
                      className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                      style={{ backgroundColor: colors.primary + '30' }}
                    >
                      <Text className="text-xs font-bold text-primary">
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="flex-1 text-sm text-muted leading-relaxed">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Button */}
            <View className="px-6 pb-4">
              <Button
                variant="primary"
                size="large"
                onPress={handleNext}
                className="w-full"
              >
                {isLastStep ? '🎉 Complete Onboarding' : `${stepData.action} →`}
              </Button>
            </View>

            {/* Navigation Buttons */}
            <View className="flex-row gap-3 px-6 pb-6">
              <Button
                variant="secondary"
                size="medium"
                onPress={previousStep}
                disabled={isFirstStep}
                className={cn('flex-1', isFirstStep && 'opacity-50')}
              >
                ← Back
              </Button>
              <Button
                variant="tertiary"
                size="medium"
                onPress={skipOnboarding}
                className="flex-1"
              >
                Skip All
              </Button>
            </View>

            {/* Step Indicators */}
            <View className="flex-row gap-1.5 px-6 pb-6 justify-center">
              {Array.from({ length: 8 }).map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    // Commented out for now - can enable if you want users to jump around
                    // useOnboarding().goToStep(index);
                  }}
                  className={cn(
                    'h-2 rounded-full',
                    index <= currentStepIndex
                      ? 'w-6'
                      : 'w-2'
                  )}
                  style={{
                    backgroundColor:
                      index <= currentStepIndex
                        ? colors.primary
                        : colors.border,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
