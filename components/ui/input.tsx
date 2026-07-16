import React, { useState } from 'react';
import { View, TextInput, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';
import { useColors } from '@/hooks/use-colors';
import { Ionicons } from '@expo/vector-icons';

export type InputVariant = 'text' | 'email' | 'password' | 'number' | 'search';

interface InputProps {
  variant?: InputVariant;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
  containerClassName?: string;
}

/**
 * Input Component
 * Follows design system with variants and states
 */
export function Input({
  variant = 'text',
  placeholder,
  value,
  onChangeText,
  label,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  className,
  containerClassName,
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const keyboardType = {
    text: 'default',
    email: 'email-address',
    password: 'default',
    number: 'number-pad',
    search: 'default',
  }[variant];

  const secureTextEntry = variant === 'password' && !showPassword;

  return (
    <View className={cn('gap-2', containerClassName)}>
      {label && <Text className="text-sm font-semibold text-foreground">{label}</Text>}

      <View
        className={cn(
          'flex-row items-center border rounded-lg px-3 py-2 gap-2',
          focused ? 'border-primary border-2' : 'border-border',
          error ? 'border-error border-2' : '',
          disabled ? 'opacity-50 bg-muted/10' : 'bg-background',
        )}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType as any}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn('flex-1 text-foreground text-base', className)}
          style={{ color: colors.foreground }}
        />

        {variant === 'password' && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            className="p-2 active:opacity-70"
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.foreground} />
          </Pressable>
        )}

        {variant === 'search' && <Ionicons name="search" size={20} color={colors.muted} />}
      </View>

      {error && <Text className="text-xs font-semibold text-error">{error}</Text>}
    </View>
  );
}

/**
 * Select Component
 */
interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  disabled = false,
  error,
}: SelectProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <View className="gap-2">
      {label && <Text className="text-sm font-semibold text-foreground">{label}</Text>}

      <Pressable
        onPress={() => !disabled && setOpen(!open)}
        className={cn(
          'flex-row items-center justify-between border rounded-lg px-3 py-3 gap-2',
          error ? 'border-error' : 'border-border',
          disabled ? 'opacity-50 bg-muted/10' : 'bg-background',
        )}
      >
        <Text className={cn('text-base', value ? 'text-foreground' : 'text-muted')}>
          {selectedLabel}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.foreground} />
      </Pressable>

      {open && (
        <View className="border border-border rounded-lg bg-surface overflow-hidden">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onValueChange?.(option.value);
                setOpen(false);
              }}
              className={cn(
                'px-3 py-3 border-b border-border last:border-b-0',
                value === option.value ? 'bg-primary/10' : '',
              )}
            >
              <Text
                className={cn(
                  'text-base',
                  value === option.value ? 'text-primary font-semibold' : 'text-foreground',
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {error && <Text className="text-xs font-semibold text-error">{error}</Text>}
    </View>
  );
}

/**
 * Toggle Component
 */
interface ToggleProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, label, disabled = false }: ToggleProps) {
  const colors = useColors();

  return (
    <View className="flex-row items-center justify-between gap-3">
      {label && <Text className="text-base text-foreground flex-1">{label}</Text>}

      <Pressable
        onPress={() => !disabled && onValueChange?.(!value)}
        disabled={disabled}
        className={cn(
          'w-12 h-7 rounded-full flex items-center justify-start px-1',
          value ? 'bg-primary' : 'bg-border',
          disabled ? 'opacity-50' : '',
        )}
        style={{
          backgroundColor: value ? colors.primary : colors.border,
        }}
      >
        <View className={cn('w-5 h-5 rounded-full bg-background', value ? 'ml-auto' : '')} />
      </Pressable>
    </View>
  );
}
