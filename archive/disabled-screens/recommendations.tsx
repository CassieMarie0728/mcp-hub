import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Recommendations Screen
 * Shows personalized macro recommendations based on user behavior
 */
export default function RecommendationsScreen() {
  const router = useRouter();
  const colors = useColors();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'category'>('personalized');
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Simulate loading recommendations
    setTimeout(() => {
      setRecommendations([
        {
          id: '1',
          name: 'Send WhatsApp Message',
          author: 'John Doe',
          rating: 4.8,
          downloads: 1250,
          personalizationScore: 0.92,
          explanation: 'You often use messaging macros • Highly rated (4.8⭐)',
        },
        {
          id: '2',
          name: 'Auto Email Responder',
          author: 'Jane Smith',
          rating: 4.6,
          downloads: 980,
          personalizationScore: 0.87,
          explanation: 'Matches your medium skill level • Popular choice',
        },
        {
          id: '3',
          name: 'Screenshot & Share',
          author: 'Mike Johnson',
          rating: 4.5,
          downloads: 850,
          personalizationScore: 0.81,
          explanation: 'Similar to macros you use • 850+ downloads',
        },
        {
          id: '4',
          name: 'Daily Reminder',
          author: 'Sarah Williams',
          rating: 4.7,
          downloads: 720,
          personalizationScore: 0.79,
          explanation: 'Users similar to you enjoy this macro',
        },
        {
          id: '5',
          name: 'Social Media Post',
          author: 'Alex Brown',
          rating: 4.4,
          downloads: 650,
          personalizationScore: 0.75,
          explanation: 'Trending in your favorite category',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  /**
   * Render recommendation card
   */
  const renderRecommendationCard = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/macro/${item.id}`)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-80"
    >
      <View className="gap-3">
        {/* Header */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-foreground text-base">{item.name}</Text>
            <Text className="text-xs text-muted">{item.author}</Text>
          </View>

          {/* Personalization Score */}
          <View className="bg-primary/20 rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-primary">
              {Math.round(item.personalizationScore * 100)}%
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-muted">⭐ {item.rating}</Text>
          <Text className="text-sm text-muted">•</Text>
          <Text className="text-sm text-muted">📥 {item.downloads}</Text>
        </View>

        {/* Explanation */}
        <View className="bg-primary/10 rounded-lg p-2 border border-primary/20">
          <Text className="text-xs text-foreground">{item.explanation}</Text>
        </View>

        {/* Action Button */}
        <Pressable className="bg-primary rounded-lg p-2 active:opacity-80">
          <Text className="text-center font-semibold text-background text-sm">View Macro</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-foreground">Loading recommendations...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Recommended For You</Text>
            <Text className="text-base text-muted">Personalized based on your activity</Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1 border border-border">
            <Pressable
              onPress={() => setActiveTab('personalized')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'personalized' ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'personalized' ? 'text-background' : 'text-foreground'
                )}
              >
                For You
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('trending')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'trending' ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'trending' ? 'text-background' : 'text-foreground'
                )}
              >
                Trending
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('category')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'category' ? 'bg-primary' : 'bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'category' ? 'text-background' : 'text-foreground'
                )}
              >
                Category
              </Text>
            </Pressable>
          </View>

          {/* Recommendations List */}
          {activeTab === 'personalized' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">PERSONALIZED PICKS</Text>
              <FlatList
                scrollEnabled={false}
                data={recommendations}
                keyExtractor={(item) => item.id}
                renderItem={renderRecommendationCard}
              />
            </View>
          )}

          {activeTab === 'trending' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">TRENDING NOW</Text>
              <FlatList
                scrollEnabled={false}
                data={recommendations.slice(0, 3)}
                keyExtractor={(item) => item.id}
                renderItem={renderRecommendationCard}
              />
            </View>
          )}

          {activeTab === 'category' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">BY CATEGORY</Text>

              {['Messaging', 'Productivity', 'Social Media', 'Automation'].map((category, idx) => (
                <Pressable
                  key={idx}
                  className="bg-surface rounded-lg p-3 border border-border active:opacity-80"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-foreground">{category}</Text>
                    <Text className="text-sm text-muted">→</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80 mt-4"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
