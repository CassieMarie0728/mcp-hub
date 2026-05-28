import React from 'react';
import { View, Pressable, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  interactive?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

/**
 * Card Component
 * Follows design system with variants and states
 */
export function Card({
  variant = 'elevated',
  interactive = false,
  onPress,
  children,
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    elevated: 'bg-surface border border-border shadow-sm',
    outlined: 'bg-background border border-border',
    filled: 'bg-surface',
  };

  const Component = interactive ? Pressable : View;

  return (
    <Component
      onPress={interactive ? onPress : undefined}
      className={cn(
        'rounded-lg p-4',
        variantStyles[variant],
        interactive && 'active:opacity-80',
        className,
      )}
      style={
        interactive
          ? ({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
              },
            ]
          : undefined
      }
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Card Header Component
 */
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-2 mb-3">
      <View className="flex-1">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        {subtitle && <Text className="text-sm text-muted mt-1">{subtitle}</Text>}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

/**
 * Card Content Component
 */
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn('gap-2', className)}>{children}</View>;
}

/**
 * Card Footer Component
 */
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <View className={cn('flex-row gap-2 pt-4 border-t border-border', className)}>{children}</View>
  );
}

// Import Text for CardHeader
import { Text } from 'react-native';
