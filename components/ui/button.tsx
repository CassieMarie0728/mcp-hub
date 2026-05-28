import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  className?: string;
  haptic?: boolean;
}

/**
 * Button Component
 * Follows design system with variants, sizes, and states
 */
export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onPress,
  children,
  className,
  haptic = true,
}: ButtonProps) {
  const colors = useColors();

  // Size styles
  const sizeStyles = {
    small: 'px-3 py-2 min-h-[32px]',
    medium: 'px-4 py-3 min-h-[40px]',
    large: 'px-4 py-3 min-h-[48px]',
  };

  // Variant styles
  const variantStyles = {
    primary: `bg-primary rounded-lg flex-row items-center justify-center`,
    secondary: `bg-surface border border-border rounded-lg flex-row items-center justify-center`,
    tertiary: `bg-transparent flex-row items-center justify-center`,
    destructive: `bg-error rounded-lg flex-row items-center justify-center`,
    ghost: `bg-transparent flex-row items-center justify-center`,
  };

  // Text color styles
  const textColorStyles = {
    primary: 'text-background',
    secondary: 'text-foreground',
    tertiary: 'text-primary',
    destructive: 'text-background',
    ghost: 'text-foreground',
  };

  // Font size by button size
  const fontSizeStyles = {
    small: 'text-xs font-semibold',
    medium: 'text-sm font-semibold',
    large: 'text-base font-semibold',
  };

  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (haptic) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics not available on web
      }
    }

    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={cn(
        'rounded-lg items-center justify-center',
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && 'opacity-50',
        className
      )}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !disabled && !loading ? 0.97 : 1 }],
          opacity: pressed && !disabled && !loading ? 0.9 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'destructive'
              ? colors.background
              : colors.foreground
          }
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : typeof children === 'string' ? (
        <Text className={cn(fontSizeStyles[size], textColorStyles[variant])}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/**
 * Button Group Component
 * Multiple buttons with consistent spacing
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: number;
}

export function ButtonGroup({ children, direction = 'column', gap = 2 }: ButtonGroupProps) {
  const gapMap = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
  } as const;
  const gapClass = gapMap[gap as keyof typeof gapMap] || 'gap-2';

  return (
    <View className={cn('flex', direction === 'row' ? 'flex-row' : 'flex-col', gapClass)}>
      {children}
    </View>
  );
}
