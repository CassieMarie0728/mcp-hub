import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useState, useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useMCPBridgeExtended, type PerceptionData } from '@/hooks/use-mcp-bridge-extended';

export default function PerceptionTestScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useColors();
  const { capturePerception } = useMCPBridgeExtended();
  const [perception, setPerception] = useState<PerceptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Perception Test',
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
          <MaterialIcons name="visibility" size={24} color={colors.primary} />
        </View>
      ),
    });
  }, [navigation, colors]);

  const handleCapturePerception = async () => {
    setIsLoading(true);
    try {
      const data = await capturePerception();
      setPerception(data);
      setSelectedChip(null);
    } catch (error: any) {
      Alert.alert('Error', `Failed to capture perception: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Capture Button */}
        <TouchableOpacity
          onPress={handleCapturePerception}
          disabled={isLoading}
          className="bg-primary rounded-lg py-4 items-center justify-center flex-row gap-2 mb-6"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <MaterialIcons name="screenshot-monitor" size={20} color={colors.background} />
              <Text className="text-background font-semibold">Capture Screen Perception</Text>
            </>
          )}
        </TouchableOpacity>

        {perception ? (
          <>
            {/* Summary Card */}
            <View className="bg-surface border border-border rounded-lg p-4 mb-6">
              <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-border">
                <Text className="text-sm text-muted">Captured at</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {formatTimestamp(perception.timestamp)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">Elements Detected</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {perception.elementCount}
                </Text>
              </View>
            </View>

            {/* Accessibility Elements */}
            {perception.elements.length > 0 && (
              <View className="mb-6">
                <Text className="text-foreground font-semibold mb-3">Accessibility Tree</Text>
                <View className="bg-surface border border-border rounded-lg p-4">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="gap-2">
                      {perception.elements.slice(0, 5).map((elem, idx) => (
                        <View
                          key={idx}
                          className="bg-background border border-border rounded px-3 py-2"
                        >
                          <Text className="text-xs font-mono text-foreground">
                            {elem.type || 'unknown'}
                          </Text>
                          <Text className="text-xs text-muted mt-1">
                            {elem.label?.substring(0, 30) || '(no label)'}
                          </Text>
                          {elem.description && (
                            <Text className="text-xs text-muted mt-1">
                              {elem.description.substring(0, 30)}
                            </Text>
                          )}
                        </View>
                      ))}
                      {perception.elements.length > 5 && (
                        <View className="bg-background border border-border rounded px-3 py-2 items-center justify-center">
                          <Text className="text-xs text-muted font-semibold">
                            +{perception.elements.length - 5} more
                          </Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Visual Chips */}
            {perception.visualChips.length > 0 && (
              <View className="mb-6">
                <Text className="text-foreground font-semibold mb-3">Visual Chips</Text>
                <View className="bg-surface border border-border rounded-lg p-4">
                  {selectedChip !== null ? (
                    <View>
                      <TouchableOpacity
                        onPress={() => setSelectedChip(null)}
                        className="mb-3 flex-row items-center gap-2"
                      >
                        <MaterialIcons name="arrow-back" size={18} color={colors.primary} />
                        <Text className="text-sm text-primary font-semibold">Back to List</Text>
                      </TouchableOpacity>
                      <Image
                        source={{ uri: `data:image/png;base64,${perception.visualChips[selectedChip]}` }}
                        style={{ width: '100%', height: 300, borderRadius: 8 }}
                        resizeMode="contain"
                      />
                      <Text className="text-xs text-muted mt-2 text-center">
                        Chip {selectedChip + 1} of {perception.visualChips.length}
                      </Text>
                    </View>
                  ) : (
                    <View className="gap-2">
                      {perception.visualChips.map((chip, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setSelectedChip(idx)}
                          className="bg-background border border-border rounded p-3 flex-row items-center justify-between"
                        >
                          <Text className="text-sm text-foreground font-semibold">Chip {idx + 1}</Text>
                          <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Raw JSON */}
            <View className="mb-6">
              <Text className="text-foreground font-semibold mb-3">Perception Summary</Text>
              <View className="bg-background border border-border rounded-lg p-4">
                <Text className="text-xs font-mono text-muted">
                  {JSON.stringify(
                    {
                      elementCount: perception.elementCount,
                      accessibilityElements: perception.elements.length,
                      visualChips: perception.visualChips.length,
                      timestamp: perception.timestamp,
                    },
                    null,
                    2
                  )}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <MaterialIcons name="visibility-off" size={48} color={colors.muted} />
            <Text className="text-foreground font-semibold mt-4">No Perception Data</Text>
            <Text className="text-muted text-sm text-center mt-2">
              Tap &quot;Capture Screen Perception&quot; to see what the AI sees on this screen
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-6">
          <View className="flex-row gap-2">
            <MaterialIcons name="info" size={16} color={colors.primary} />
            <Text className="text-xs text-muted flex-1">
              The Hybrid Perception Engine combines accessibility tree data with visual chips to
              give AI agents a complete understanding of the current screen.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
