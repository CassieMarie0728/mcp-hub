import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/lib/onboarding-context';
import { useColors } from '@/hooks/use-colors';

export function OnboardingSettings() {
  const { resetOnboarding, hasCompletedOnboarding } = useOnboarding();
  const colors = useColors();

  if (!hasCompletedOnboarding) {
    return null;
  }

  return (
    <View className="border-t border-border pt-4">
      <Text className="text-sm font-semibold text-foreground mb-3 px-4">Onboarding</Text>
      <Pressable
        onPress={resetOnboarding}
        className="flex-row items-center gap-3 px-4 py-3 active:opacity-70"
      >
        <Ionicons name="play-circle" size={20} color={colors.primary} />
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">Replay Onboarding</Text>
          <Text className="text-xs text-muted mt-1">Walk through the feature tour again</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}
