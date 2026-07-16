import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { cn } from '@/lib/utils';

interface AIAssistantButtonProps {
  variant?: 'floating' | 'header' | 'inline';
  className?: string;
}

export function AIAssistantButton({ variant = 'header', className }: AIAssistantButtonProps) {
  const colors = useColors();
  const { openAssistant } = useAIAssistant();

  if (variant === 'floating') {
    return (
      <TouchableOpacity
        onPress={openAssistant}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-2xl">✨</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'header') {
    return (
      <TouchableOpacity
        onPress={openAssistant}
        className={cn('px-3 py-2 rounded-lg items-center justify-center', className)}
        style={{ backgroundColor: colors.surface }}
      >
        <Text className="text-lg">✨</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={openAssistant}
      className={cn('flex-row items-center gap-2 px-3 py-2 rounded-lg', className)}
      style={{ backgroundColor: colors.primary }}
    >
      <Text className="text-lg">✨</Text>
      <Text className="text-sm font-semibold text-background">Ask AI</Text>
    </TouchableOpacity>
  );
}
