import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

export default function MacroDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1">
        <View className="bg-gradient-to-b from-primary/10 to-background p-6 gap-4">
          <Text className="text-3xl font-bold text-foreground">Macro Details</Text>
          <Text className="text-base text-muted">ID: {id}</Text>
        </View>

        <View className="p-6 gap-4">
          <Text className="text-lg font-semibold text-foreground">Loading macro details...</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
