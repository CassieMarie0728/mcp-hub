import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Trending Dashboard Screen
 * Shows trending macros, popular versions, and community insights
 */
export default function TrendingDashboardScreen() {
  const router = useRouter();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'insights'>('trending');

  // Mock data
  const trendingMacros = [
    {
      id: '1',
      name: 'Send WhatsApp Message',
      author: 'John Doe',
      downloads: 1250,
      rating: 4.8,
      trend: '+45%',
    },
    {
      id: '2',
      name: 'Auto Email Responder',
      author: 'Jane Smith',
      downloads: 980,
      rating: 4.6,
      trend: '+32%',
    },
    {
      id: '3',
      name: 'Screenshot & Share',
      author: 'Mike Johnson',
      downloads: 850,
      rating: 4.5,
      trend: '+28%',
    },
    {
      id: '4',
      name: 'Daily Reminder',
      author: 'Sarah Williams',
      downloads: 720,
      rating: 4.7,
      trend: '+18%',
    },
    {
      id: '5',
      name: 'Social Media Post',
      author: 'Alex Brown',
      downloads: 650,
      rating: 4.4,
      trend: '+12%',
    },
  ];

  const popularMacros = [
    {
      id: '1',
      name: 'Send WhatsApp Message',
      author: 'John Doe',
      rating: 4.9,
      reviews: 245,
    },
    {
      id: '2',
      name: 'Auto Email Responder',
      author: 'Jane Smith',
      rating: 4.8,
      reviews: 189,
    },
    {
      id: '3',
      name: 'Screenshot & Share',
      author: 'Mike Johnson',
      rating: 4.7,
      reviews: 156,
    },
  ];

  const communityInsights = {
    totalMacros: 2847,
    totalExecutions: 125000,
    avgRating: 4.6,
    successRate: 94.2,
  };

  /**
   * Render trending macro card
   */
  const renderTrendingCard = ({ item }: { item: any }) => (
    <Pressable className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-80">
      <View className="gap-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-foreground text-base">{item.name}</Text>
            <Text className="text-xs text-muted">{item.author}</Text>
          </View>

          <View className="bg-success/20 rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-success">{item.trend}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-muted">⭐ {item.rating}</Text>
            <Text className="text-sm text-muted">•</Text>
            <Text className="text-sm text-muted">📥 {item.downloads}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  /**
   * Render popular macro card
   */
  const renderPopularCard = ({ item }: { item: any }) => (
    <Pressable className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-80">
      <View className="gap-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-foreground text-base">{item.name}</Text>
            <Text className="text-xs text-muted">{item.author}</Text>
          </View>

          <View className="bg-primary/20 rounded-full px-3 py-1">
            <Text className="text-xs font-bold text-primary">⭐ {item.rating}</Text>
          </View>
        </View>

        <Text className="text-sm text-muted">{item.reviews} reviews</Text>
      </View>
    </Pressable>
  );

  /**
   * Render insights card
   */
  const renderInsightCard = (label: string, value: string | number, icon: string) => (
    <View className="flex-1 bg-surface rounded-xl p-4 border border-border gap-2">
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-xs text-muted">{label}</Text>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Trending</Text>
            <Text className="text-base text-muted">
              Discover what&apos;s popular in the community
            </Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1 border border-border">
            <Pressable
              onPress={() => setActiveTab('trending')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'trending' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'trending' ? 'text-background' : 'text-foreground',
                )}
              >
                Trending
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('popular')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'popular' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'popular' ? 'text-background' : 'text-foreground',
                )}
              >
                Popular
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('insights')}
              className={cn(
                'flex-1 rounded-md p-2 active:opacity-80',
                activeTab === 'insights' ? 'bg-primary' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  activeTab === 'insights' ? 'text-background' : 'text-foreground',
                )}
              >
                Insights
              </Text>
            </Pressable>
          </View>

          {/* Trending Tab */}
          {activeTab === 'trending' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">TRENDING THIS WEEK</Text>
              <FlatList
                scrollEnabled={false}
                data={trendingMacros}
                keyExtractor={(item) => item.id}
                renderItem={renderTrendingCard}
              />
            </View>
          )}

          {/* Popular Tab */}
          {activeTab === 'popular' && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-muted">TOP RATED</Text>
              <FlatList
                scrollEnabled={false}
                data={popularMacros}
                keyExtractor={(item) => item.id}
                renderItem={renderPopularCard}
              />
            </View>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <View className="gap-4">
              <Text className="text-sm font-semibold text-muted">COMMUNITY STATISTICS</Text>

              {/* Stats Grid */}
              <View className="gap-3">
                <View className="flex-row gap-3">
                  {renderInsightCard('Total Macros', communityInsights.totalMacros, '📦')}
                  {renderInsightCard('Avg Rating', communityInsights.avgRating, '⭐')}
                </View>

                <View className="flex-row gap-3">
                  {renderInsightCard('Executions', '125K', '⚡')}
                  {renderInsightCard('Success Rate', `${communityInsights.successRate}%`, '✅')}
                </View>
              </View>

              {/* Top Categories */}
              <View className="gap-3">
                <Text className="text-sm font-semibold text-muted">TOP CATEGORIES</Text>

                {[
                  { name: 'Messaging', count: 324, color: 'bg-blue-500/20 border-blue-500' },
                  { name: 'Productivity', count: 287, color: 'bg-green-500/20 border-green-500' },
                  { name: 'Social Media', count: 256, color: 'bg-purple-500/20 border-purple-500' },
                  { name: 'Automation', count: 198, color: 'bg-orange-500/20 border-orange-500' },
                ].map((cat, idx) => (
                  <View key={idx} className={cn('rounded-lg p-3 border', cat.color)}>
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-foreground">{cat.name}</Text>
                      <Text className="text-sm text-muted">{cat.count} macros</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Growth Chart */}
              <View className="gap-3">
                <Text className="text-sm font-semibold text-muted">GROWTH TREND</Text>

                <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                  {[
                    { week: 'Week 1', value: 45, bar: '████░░░░░░' },
                    { week: 'Week 2', value: 62, bar: '██████░░░░' },
                    { week: 'Week 3', value: 78, bar: '████████░░' },
                    { week: 'Week 4', value: 95, bar: '██████████' },
                  ].map((item, idx) => (
                    <View key={idx} className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-muted">{item.week}</Text>
                        <Text className="text-xs font-bold text-primary">{item.value}%</Text>
                      </View>
                      <Text className="text-xs font-mono text-primary">{item.bar}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
