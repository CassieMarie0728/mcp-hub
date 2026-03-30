import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useMacros } from '@/hooks/use-macros';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/list';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroDescription, setNewMacroDescription] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

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
    <Card variant="elevated" className="mb-3">
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/macro-editor',
            params: { id: item.id },
          } as any);
        }}
        className="flex-row items-start justify-between gap-3"
      >
        {/* Macro Icon */}
        <View className="w-12 h-12 rounded-lg bg-primary/20 items-center justify-center">
          <Ionicons name="layers" size={24} color={colors.primary} />
        </View>

        {/* Macro Info */}
        <View className="flex-1 gap-2">
          <Text className="text-lg font-bold text-foreground">{item.name}</Text>
          {item.description && (
            <Text className="text-sm text-muted">{item.description}</Text>
          )}
          <View className="flex-row items-center gap-2">
            <Badge variant="secondary">{item.actions.length} actions</Badge>
            <Text className="text-xs text-muted">{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => handleDeleteMacro(item.id, item.name)}
          className="w-10 h-10 rounded-lg bg-error/10 items-center justify-center"
        >
          <Ionicons name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View className="bg-gradient-to-b from-primary to-primary/80 px-6 pt-6 pb-8">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-4xl font-bold text-background">Macro Management</Text>
            <Text className="text-sm text-background/80 mt-2">Create and manage automation sequences</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="close" size={28} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Card */}
        <Card variant="elevated" className="mb-6">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-sm text-muted">Total Macros</Text>
              <Text className="text-3xl font-bold text-foreground">{macros.length}</Text>
            </View>
            <View className="w-16 h-16 rounded-lg bg-primary/20 items-center justify-center">
              <Ionicons name="layers" size={32} color={colors.primary} />
            </View>
          </View>
        </Card>

        {/* Create Button */}
        <Button
          variant="primary"
          size="large"
          onPress={() => setShowModal(true)}
          className="mb-6"
        >
          <Ionicons name="add" size={20} color={colors.background} />
          <Text className="text-background font-semibold ml-2">Create New Macro</Text>
        </Button>

        {/* Macros List */}
        {isLoading ? (
          <View className="gap-3 pb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} variant="elevated">
                <View className="flex-row items-start justify-between gap-3">
                  <Skeleton width={48} height={48} borderRadius={8} />
                  <View className="flex-1 gap-2">
                    <Skeleton width="70%" height={20} />
                    <Skeleton width="50%" height={14} />
                    <Skeleton width="40%" height={12} />
                  </View>
                  <Skeleton width={40} height={40} borderRadius={8} />
                </View>
              </Card>
            ))}
          </View>
        ) : macros.length === 0 ? (
          <Card variant="outlined" className="items-center py-12">
            <Ionicons name="layers-outline" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4">No Macros Yet</Text>
            <Text className="text-muted text-sm text-center mt-2">
              Create your first macro to automate tool execution sequences
            </Text>
          </Card>
        ) : (
          <View className="gap-3 pb-8">
            <FlatList
              data={macros}
              renderItem={renderMacroItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Create Macro Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <Card variant="elevated" className="w-full max-w-sm">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-foreground">Create Macro</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </CardHeader>

            <CardContent className="gap-4">
              {/* Name Input */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Macro Name *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="e.g., Daily Report"
                  placeholderTextColor={colors.muted}
                  value={newMacroName}
                  onChangeText={setNewMacroName}
                  editable={!isLoading}
                />
              </View>

              {/* Description Input */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Description</Text>
                <TextInput
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="Optional description"
                  placeholderTextColor={colors.muted}
                  value={newMacroDescription}
                  onChangeText={setNewMacroDescription}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>

              {/* Buttons */}
              <View className="flex-row gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="medium"
                  onPress={() => setShowModal(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onPress={handleCreateMacro}
                  className="flex-1"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Create
                </Button>
              </View>
            </CardContent>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
