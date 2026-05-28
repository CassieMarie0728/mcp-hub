/**
 * Dry-Run Preview Component
 * Shows step-by-step workflow execution preview without side effects
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

export interface DryRunStep {
  id: string;
  name: string;
  type: 'tool' | 'condition' | 'loop' | 'parallel' | 'delay';
  status: 'pending' | 'running' | 'success' | 'skipped' | 'error';
  duration?: number;
  variables?: Record<string, any>;
  result?: any;
  error?: string;
  iterations?: number;
}

export interface DryRunPreviewProps {
  steps: DryRunStep[];
  isRunning?: boolean;
  totalDuration?: number;
  onClose?: () => void;
}

export function DryRunPreview({
  steps,
  isRunning = false,
  totalDuration = 0,
  onClose,
}: DryRunPreviewProps) {
  const colors = useColors();
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const getStatusIcon = useCallback((status: DryRunStep['status']) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'running':
        return 'hourglass-empty';
      case 'success':
        return 'check-circle';
      case 'skipped':
        return 'skip-next';
      case 'error':
        return 'error';
      default:
        return 'help';
    }
  }, []);

  const getStatusColor = useCallback((status: DryRunStep['status']) => {
    switch (status) {
      case 'pending':
        return colors.muted;
      case 'running':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'skipped':
        return colors.muted;
      case 'error':
        return colors.error;
      default:
        return colors.foreground;
    }
  }, [colors]);

  const getTypeIcon = useCallback((type: DryRunStep['type']) => {
    switch (type) {
      case 'tool':
        return 'build';
      case 'condition':
        return 'branch';
      case 'loop':
        return 'repeat';
      case 'parallel':
        return 'hub';
      case 'delay':
        return 'schedule';
      default:
        return 'help';
    }
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border p-4">
        <Text className="text-lg font-bold text-foreground">Dry-Run Preview</Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="close" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Summary */}
      <View className="bg-surface p-4 border-b border-border">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-foreground">
            {isRunning ? 'Executing...' : 'Preview Complete'}
          </Text>
          <View className="flex-row items-center gap-2">
            <MaterialIcons
              name={isRunning ? 'hourglass-empty' : 'check-circle'}
              size={16}
              color={isRunning ? colors.warning : colors.success}
            />
            <Text className="text-sm text-muted">
              {totalDuration}ms
            </Text>
          </View>
        </View>
        <Text className="text-xs text-muted">
          {steps.filter((s) => s.status === 'success').length} of {steps.length} steps
        </Text>
      </View>

      {/* Steps List */}
      <ScrollView className="flex-1">
        {steps.map((step, index) => (
          <Pressable
            key={step.id}
            onPress={() =>
              setExpandedStepId(
                expandedStepId === step.id ? null : step.id
              )
            }
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <View className="border-b border-border p-4">
              {/* Step Header */}
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons
                    name={getStatusIcon(step.status) as any}
                    size={20}
                    color={getStatusColor(step.status)}
                  />
                  <MaterialIcons
                    name={getTypeIcon(step.type) as any}
                    size={16}
                    color={colors.muted}
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-foreground">
                    {index + 1}. {step.name}
                  </Text>
                  <Text className="text-xs text-muted">
                    {step.type}
                    {step.duration && ` • ${step.duration}ms`}
                  </Text>
                </View>

                <MaterialIcons
                  name={
                    expandedStepId === step.id
                      ? 'expand-less'
                      : 'expand-more'
                  }
                  size={20}
                  color={colors.muted}
                />
              </View>

              {/* Expanded Details */}
              {expandedStepId === step.id && (
                <View className="mt-4 pt-4 border-t border-border gap-3">
                  {/* Variables */}
                  {step.variables && Object.keys(step.variables).length > 0 && (
                    <View>
                      <Text className="text-xs font-semibold text-muted mb-2">
                        Variables
                      </Text>
                      {Object.entries(step.variables).map(([key, value]) => (
                        <View
                          key={key}
                          className="bg-background rounded p-2 mb-1"
                        >
                          <Text className="text-xs font-mono text-foreground">
                            {key}:{' '}
                            <Text className="text-primary">
                              {JSON.stringify(value)}
                            </Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Result */}
                  {step.result && (
                    <View>
                      <Text className="text-xs font-semibold text-muted mb-2">
                        Result
                      </Text>
                      <View className="bg-background rounded p-2">
                        <Text className="text-xs font-mono text-success">
                          {JSON.stringify(step.result, null, 2)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Error */}
                  {step.error && (
                    <View>
                      <Text className="text-xs font-semibold text-error mb-2">
                        Error
                      </Text>
                      <View className="bg-background rounded p-2 border border-error">
                        <Text className="text-xs font-mono text-error">
                          {step.error}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Loop Info */}
                  {step.iterations !== undefined && (
                    <View className="bg-background rounded p-2">
                      <Text className="text-xs text-muted">
                        Loop iterations: {step.iterations}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-border p-4 gap-2">
        <Pressable
          className="bg-primary rounded-lg p-3 items-center"
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <Text className="text-background font-semibold">
            Execute Workflow
          </Text>
        </Pressable>
        <Pressable
          className="bg-surface rounded-lg p-3 items-center border border-border"
          onPress={onClose}
          style={({ pressed }) => [pressed && { opacity: 0.8 }]}
        >
          <Text className="text-foreground font-semibold">Close Preview</Text>
        </Pressable>
      </View>
    </View>
  );
}
