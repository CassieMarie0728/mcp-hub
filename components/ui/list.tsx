import React from 'react';
import { View, Pressable, Text, FlatList, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';

/**
 * List Item Component
 */
interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  divider?: boolean;
}

export function ListItem({
  title,
  subtitle,
  icon,
  rightElement,
  onPress,
  disabled = false,
  selected = false,
  divider = true,
}: ListItemProps) {
  const colors = useColors();

  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={cn(
          'flex-row items-center gap-3 px-4 py-3 min-h-[56px]',
          selected ? 'bg-primary/10' : 'active:bg-foreground/5',
          disabled ? 'opacity-50' : ''
        )}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={24}
            color={selected ? colors.primary : colors.foreground}
          />
        )}

        <View className="flex-1 gap-1">
          <Text
            className={cn(
              'text-base',
              selected ? 'text-primary font-semibold' : 'text-foreground font-semibold'
            )}
          >
            {title}
          </Text>
          {subtitle && <Text className="text-sm text-muted">{subtitle}</Text>}
        </View>

        {rightElement ? (
          <View>{rightElement}</View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        )}
      </Pressable>

      {divider && <View className="h-px bg-border ml-16" />}
    </View>
  );
}

/**
 * List Component
 */
interface ListProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'plain' | 'grouped';
}

export function List({ children, variant = 'plain', className, ...props }: ListProps) {
  const variantStyles = {
    plain: 'bg-background',
    grouped: 'bg-surface rounded-lg border border-border overflow-hidden',
  };

  return (
    <View className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </View>
  );
}

/**
 * List Section Component
 */
interface ListSectionProps {
  title?: string;
  children: React.ReactNode;
  footer?: string;
}

export function ListSection({ title, children, footer }: ListSectionProps) {
  return (
    <View className="gap-2 mb-4">
      {title && (
        <Text className="text-xs font-semibold text-muted uppercase px-4">{title}</Text>
      )}

      <View className="bg-surface rounded-lg border border-border overflow-hidden">
        {children}
      </View>

      {footer && <Text className="text-xs text-muted px-4">{footer}</Text>}
    </View>
  );
}

/**
 * List with Data Component
 */
interface ListDataProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  variant?: 'plain' | 'grouped';
  emptyMessage?: string;
  onEndReached?: () => void;
  loading?: boolean;
}

export function ListData<T>({
  data,
  renderItem,
  keyExtractor,
  variant = 'plain',
  emptyMessage = 'No items',
  onEndReached,
  loading = false,
}: ListDataProps<T>) {
  const variantStyles = {
    plain: 'bg-background',
    grouped: 'bg-surface rounded-lg border border-border overflow-hidden',
  };

  if (data.length === 0 && !loading) {
    return (
      <View className={cn('p-8 items-center justify-center', variantStyles[variant])}>
        <Text className="text-base text-muted text-center">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item, index }) => renderItem(item, index)}
      keyExtractor={(item, index) => keyExtractor?.(item, index) || String(index)}
      scrollEnabled={false}
      className={variantStyles[variant]}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

/**
 * Badge Component
 */
interface BadgeProps {
  variant?: 'status' | 'category' | 'count' | 'secondary';
  children: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ variant = 'status', children, color = 'primary' }: BadgeProps) {
  const colors = useColors();

  const colorMap = {
    primary: { bg: 'bg-primary', text: 'text-background' },
    success: { bg: 'bg-success', text: 'text-background' },
    warning: { bg: 'bg-warning', text: 'text-background' },
    error: { bg: 'bg-error', text: 'text-background' },
    info: { bg: 'bg-info', text: 'text-background' },
  };

  const variantStyles = {
    status: cn(colorMap[color].bg, colorMap[color].text, 'rounded px-2 py-1'),
    category: cn(
      'border',
      color === 'primary' ? 'border-primary text-primary' : `border-${color} text-${color}`,
      'rounded px-2 py-1'
    ),
    count: cn(colorMap[color].bg, colorMap[color].text, 'rounded-full w-6 h-6 items-center justify-center'),
    secondary: cn('bg-surface border border-border text-foreground rounded px-2 py-1'),
  };

  return (
    <View className={variantStyles[variant]}>
      <Text className={cn('text-xs font-semibold', colorMap[color].text)}>
        {children}
      </Text>
    </View>
  );
}
