import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';

export interface SaveAsMacroModalProps {
  visible: boolean;
  executionIds: string[];
  onSave: (name: string, description?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SaveAsMacroModal({
  visible,
  executionIds,
  onSave,
  onCancel,
  isLoading = false,
}: SaveAsMacroModalProps) {
  const colors = useColors();
  const [macroName, setMacroName] = useState('');
  const [macroDescription, setMacroDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!macroName.trim()) {
      Alert.alert('Validation Error', 'Macro name is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(macroName, macroDescription);
      setMacroName('');
      setMacroDescription('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save macro');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMacroName('');
    setMacroDescription('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      {/* Backdrop */}
      <Pressable
        onPress={handleCancel}
        className="flex-1 bg-black/50 justify-center items-center"
        disabled={isSaving}
      >
        {/* Modal Content */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-background rounded-2xl p-6 w-11/12 max-w-md"
        >
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground mb-2">Save as Macro</Text>
          <Text className="text-sm text-muted mb-6">
            Save this execution sequence as a reusable macro
          </Text>

          {/* Macro Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-muted mb-2">Macro Name *</Text>
            <TextInput
              value={macroName}
              onChangeText={setMacroName}
              placeholder="Enter macro name"
              placeholderTextColor={colors.muted}
              editable={!isSaving}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Macro Description Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">Description</Text>
            <TextInput
              value={macroDescription}
              onChangeText={setMacroDescription}
              placeholder="Enter macro description (optional)"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              editable={!isSaving}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Info Box */}
          <View className="bg-primary/10 rounded-lg p-3 mb-6">
            <Text className="text-xs text-primary font-semibold mb-1">📝 Execution Details</Text>
            <Text className="text-xs text-primary">
              {executionIds.length} execution{executionIds.length !== 1 ? 's' : ''} will be recorded
              as macro steps
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={handleCancel}
              className="flex-1 bg-surface border border-border rounded-lg py-3"
              disabled={isSaving}
            >
              <Text className="text-foreground font-semibold text-center">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              className="flex-1 bg-primary rounded-lg py-3"
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">Save Macro</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
