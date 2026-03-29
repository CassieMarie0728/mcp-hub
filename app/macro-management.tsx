import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useMacros } from '@/hooks/use-macros';

interface MacroItem {
  id: string;
  name: string;
  description?: string;
  actions: any[];
  createdAt: number;
}

export default function MacroManagementScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { macros, createMacro, deleteMacro } = useMacros();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroDescription, setNewMacroDescription] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Macro Management',
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
      },
      headerStyle: {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        borderBottomWidth: 1,
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ marginRight: 16 }}>
          <MaterialIcons name="automation" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const handleCreateMacro = async () => {
    if (!newMacroName.trim()) {
      Alert.alert('Error', 'Please enter a macro name');
      return;
    }

    setIsLoading(true);
    try {
      await createMacro({
        name: newMacroName.trim(),
        description: newMacroDescription.trim() || undefined,
        actions: [],
      });
      setNewMacroName('');
      setNewMacroDescription('');
      setShowModal(false);
      Alert.alert('Success', 'Macro created successfully');
    } catch (error: any) {
      Alert.alert('Error', `Failed to create macro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMacro = (id: string, name: string) => {
    Alert.alert('Delete Macro?', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteMacro(id);
            Alert.alert('Success', 'Macro deleted');
          } catch (error: any) {
            Alert.alert('Error', `Failed to delete macro: ${error.message}`);
          }
        },
      },
    ]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const renderMacroItem = ({ item }: { item: MacroItem }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to macro editor
        router.push({
          pathname: '/macro-editor',
          params: { id: item.id },
        } as any);
      }}
      className="bg-surface border border-border rounded-lg p-4 mb-3 flex-row items-start justify-between"
    >
      <View className="flex-1">
        <Text className="text-foreground font-semibold">{item.name}</Text>
        {item.description && (
          <Text className="text-xs text-muted mt-1">{item.description}</Text>
        )}
        <View className="flex-row items-center gap-3 mt-2">
          <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-1 rounded">
            <MaterialIcons name="layers" size={14} color={colors.primary} />
            <Text className="text-xs text-primary font-semibold">{item.actions.length} actions</Text>
          </View>
          <Text className="text-xs text-muted">{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteMacro(item.id, item.name)}
        className="p-2"
      >
        <MaterialIcons name="delete" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Create Button */}
      <View className="bg-surface border-b border-border px-6 py-4">
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="bg-primary rounded-lg py-3 items-center justify-center flex-row gap-2"
        >
          <MaterialIcons name="add" size={20} color={colors.background} />
          <Text className="text-background font-semibold">Create New Macro</Text>
        </TouchableOpacity>
      </View>

      {/* Macros List */}
      {macros.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="automation" size={48} color={colors.muted} />
          <Text className="text-foreground font-semibold mt-4">No Macros Yet</Text>
          <Text className="text-muted text-sm text-center mt-2">
            Create your first macro to automate tool execution sequences
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-4">
          <FlatList
            data={macros}
            renderItem={renderMacroItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
          <View className="h-6" />
        </ScrollView>
      )}

      {/* Create Macro Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-background rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-foreground mb-4">Create New Macro</Text>

            <Text className="text-sm font-semibold text-foreground mb-2">Macro Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-4"
              placeholder="e.g., Daily Report"
              placeholderTextColor={colors.muted}
              value={newMacroName}
              onChangeText={setNewMacroName}
              editable={!isLoading}
            />

            <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mb-6"
              placeholder="Optional description"
              placeholderTextColor={colors.muted}
              value={newMacroDescription}
              onChangeText={setNewMacroDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setNewMacroName('');
                  setNewMacroDescription('');
                }}
                disabled={isLoading}
                className="flex-1 bg-surface border border-border rounded-lg py-3 items-center justify-center"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateMacro}
                disabled={isLoading || !newMacroName.trim()}
                className="flex-1 bg-primary rounded-lg py-3 items-center justify-center"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text className="text-background font-semibold">Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Box */}
      <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mx-6 mb-6">
        <View className="flex-row gap-2">
          <MaterialIcons name="info" size={16} color={colors.primary} />
          <Text className="text-xs text-muted flex-1">
            Macros allow you to define sequences of tool actions that can be executed automatically
            with a single command.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
