import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Templates Gallery Screen
 * Browse and use pre-built macro templates
 */
export default function TemplatesGalleryScreen() {
  const router = useRouter();
  const colors = useColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'new'>('downloads');

  // Mock templates data
  const templates = [
    {
      id: 'email_automation',
      name: 'Email Automation',
      description: 'Automatically send emails with templates',
      category: 'productivity',
      difficulty: 'beginner',
      rating: 4.7,
      downloads: 1250,
      icon: '✉️',
    },
    {
      id: 'social_media_post',
      name: 'Social Media Post',
      description: 'Post content to Instagram, Twitter, or Facebook',
      category: 'social',
      difficulty: 'beginner',
      rating: 4.5,
      downloads: 980,
      icon: '📱',
    },
    {
      id: 'data_entry',
      name: 'Data Entry',
      description: 'Automatically fill forms with data',
      category: 'productivity',
      difficulty: 'intermediate',
      rating: 4.8,
      downloads: 750,
      icon: '📝',
    },
    {
      id: 'message_automation',
      name: 'Message Automation',
      description: 'Send messages via WhatsApp, Telegram, or SMS',
      category: 'messaging',
      difficulty: 'beginner',
      rating: 4.6,
      downloads: 2100,
      icon: '💬',
    },
    {
      id: 'screenshot_share',
      name: 'Screenshot & Share',
      description: 'Take screenshot and share to social media',
      category: 'media',
      difficulty: 'beginner',
      rating: 4.3,
      downloads: 620,
      icon: '📸',
    },
    {
      id: 'daily_reminder',
      name: 'Daily Reminder',
      description: 'Set up daily reminders for tasks',
      category: 'productivity',
      difficulty: 'intermediate',
      rating: 4.7,
      downloads: 890,
      icon: '🔔',
    },
  ];

  const categories = ['productivity', 'social', 'messaging', 'media'];

  /**
   * Filter templates
   */
  const filteredTemplates = templates
    .filter((t) => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedCategory && t.category !== selectedCategory) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'downloads') return b.downloads - a.downloads;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  /**
   * Render template card
   */
  const renderTemplateCard = ({ item }: { item: any }) => (
    <Pressable
      key={item.id}
      onPress={() => router.push(`/template/${item.id}`)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border gap-3 active:opacity-80"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-2xl">{item.icon}</Text>
            <Text className="font-semibold text-foreground text-base">{item.name}</Text>
          </View>
          <Text className="text-xs text-muted">{item.description}</Text>
        </View>

        <View className="bg-primary/20 rounded-full px-2 py-1">
          <Text className="text-xs font-bold text-primary capitalize">{item.difficulty}</Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-1">
          <Text className="text-sm">⭐</Text>
          <Text className="text-sm font-semibold text-foreground">{item.rating}</Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="text-sm">📥</Text>
          <Text className="text-sm font-semibold text-foreground">{item.downloads}</Text>
        </View>

        <View className="flex-1" />

        <Pressable className="bg-primary rounded-lg px-3 py-2 active:opacity-80">
          <Text className="font-semibold text-background text-sm">Use Template</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Macro Templates</Text>
            <Text className="text-base text-muted">Pre-built workflows for common tasks</Text>
          </View>

          {/* Search */}
          <View className="bg-surface rounded-lg border border-border p-2 flex-row items-center gap-2">
            <Text className="text-lg">🔍</Text>
            <TextInput
              placeholder="Search templates..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground"
              style={{ color: colors.foreground }}
            />
          </View>

          {/* Category Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">CATEGORIES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedCategory(null)}
                className={cn(
                  'rounded-full px-4 py-2 active:opacity-80',
                  selectedCategory === null ? 'bg-primary' : 'bg-surface border border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    selectedCategory === null ? 'text-background' : 'text-foreground'
                  )}
                >
                  All
                </Text>
              </Pressable>

              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={cn(
                    'rounded-full px-4 py-2 active:opacity-80',
                    selectedCategory === cat ? 'bg-primary' : 'bg-surface border border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'font-semibold text-sm capitalize',
                      selectedCategory === cat ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSortBy('downloads')}
              className={cn(
                'flex-1 rounded-lg p-2 active:opacity-80',
                sortBy === 'downloads' ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  sortBy === 'downloads' ? 'text-background' : 'text-foreground'
                )}
              >
                Most Downloaded
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortBy('rating')}
              className={cn(
                'flex-1 rounded-lg p-2 active:opacity-80',
                sortBy === 'rating' ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  sortBy === 'rating' ? 'text-background' : 'text-foreground'
                )}
              >
                Top Rated
              </Text>
            </Pressable>
          </View>

          {/* Templates List */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">
              {filteredTemplates.length} TEMPLATES
            </Text>
            <FlatList
              scrollEnabled={false}
              data={filteredTemplates}
              keyExtractor={(item) => item.id}
              renderItem={renderTemplateCard}
            />
          </View>

          {filteredTemplates.length === 0 && (
            <View className="bg-surface rounded-lg p-6 border border-border items-center gap-2">
              <Text className="text-2xl">🔍</Text>
              <Text className="font-semibold text-foreground">No templates found</Text>
              <Text className="text-sm text-muted text-center">
                Try adjusting your search or filters
              </Text>
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
