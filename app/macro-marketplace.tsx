import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, FlatList, Image, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Marketplace Screen
 * Browse, search, and download community macros
 */
export default function MacroMarketplaceScreen() {
  const router = useRouter();
  const colors = useColors();

  // State
  const [macros, setMacros] = useState<any[]>([]);
  const [filteredMacros, setFilteredMacros] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('downloads');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<any | null>(null);

  const categories = [
    'productivity',
    'communication',
    'social_media',
    'entertainment',
    'utilities',
    'automation',
    'other',
  ];

  // Load macros
  useEffect(() => {
    loadMacros();
  }, []);

  // Filter macros
  useEffect(() => {
    let filtered = macros;

    if (searchQuery) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    setFilteredMacros(filtered);
  }, [macros, searchQuery, selectedCategory]);

  /**
   * Load macros from API
   */
  const loadMacros = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data for now
      const mockMacros = [
        {
          id: 'macro_1',
          name: 'Send WhatsApp Message',
          description: 'Automatically send a WhatsApp message to a contact',
          category: 'communication',
          author: 'John Doe',
          rating: 4.8,
          downloads: 1250,
          reviews: 45,
          tags: ['whatsapp', 'messaging', 'automation'],
          createdAt: '2024-01-15',
        },
        {
          id: 'macro_2',
          name: 'Daily Email Summary',
          description: 'Collect and summarize emails from the day',
          category: 'productivity',
          author: 'Jane Smith',
          rating: 4.6,
          downloads: 890,
          reviews: 32,
          tags: ['email', 'productivity', 'summary'],
          createdAt: '2024-01-10',
        },
        {
          id: 'macro_3',
          name: 'Instagram Story Poster',
          description: 'Automatically post to Instagram stories',
          category: 'social_media',
          author: 'Mike Johnson',
          rating: 4.5,
          downloads: 2100,
          reviews: 78,
          tags: ['instagram', 'social', 'posting'],
          createdAt: '2024-01-08',
        },
        {
          id: 'macro_4',
          name: 'Quick Notes Saver',
          description: 'Save notes to cloud storage with one tap',
          category: 'utilities',
          author: 'Sarah Lee',
          rating: 4.9,
          downloads: 560,
          reviews: 21,
          tags: ['notes', 'cloud', 'storage'],
          createdAt: '2024-01-05',
        },
        {
          id: 'macro_5',
          name: 'Meeting Scheduler',
          description: 'Schedule meetings and send invitations',
          category: 'productivity',
          author: 'Tom Wilson',
          rating: 4.7,
          downloads: 1450,
          reviews: 55,
          tags: ['calendar', 'meetings', 'scheduling'],
          createdAt: '2024-01-03',
        },
      ];

      setMacros(mockMacros);
    } catch (error) {
      Alert.alert('Error', 'Failed to load macros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Download macro
   */
  const handleDownloadMacro = useCallback((macro: any) => {
    Alert.alert('Success', `Downloaded "${macro.name}"`, [
      {
        text: 'OK',
        onPress: () => setSelectedMacro(null),
      },
    ]);
  }, []);

  /**
   * Rate macro
   */
  const handleRateMacro = useCallback((macro: any, rating: number) => {
    Alert.alert('Thank you!', `You rated "${macro.name}" ${rating} stars`);
  }, []);

  /**
   * Render macro card
   */
  const renderMacroCard = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => setSelectedMacro(item)}
      className="bg-surface rounded-xl p-4 mb-3 border border-border active:opacity-70"
    >
      <View className="gap-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
            <Text className="text-xs text-muted mt-1">by {item.author}</Text>
          </View>
          <View className="bg-primary/20 rounded-full px-2 py-1">
            <Text className="text-xs font-semibold text-primary">{item.category}</Text>
          </View>
        </View>

        <Text className="text-sm text-muted">{item.description}</Text>

        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Text className="text-yellow-500">★</Text>
              <Text className="text-xs font-semibold text-foreground">{item.rating}</Text>
              <Text className="text-xs text-muted">({item.reviews})</Text>
            </View>
            <Text className="text-xs text-muted">📥 {item.downloads}</Text>
          </View>
          <Pressable
            onPress={() => handleDownloadMacro(item)}
            className="bg-primary rounded-lg px-3 py-1 active:opacity-80"
          >
            <Text className="text-xs font-semibold text-background">Get</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  /**
   * Render macro detail modal
   */
  const renderMacroDetail = () => {
    if (!selectedMacro) return null;

    return (
      <View className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <View className="bg-background rounded-2xl p-6 w-full max-w-sm gap-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{selectedMacro.name}</Text>
              <Text className="text-sm text-muted mt-1">by {selectedMacro.author}</Text>
            </View>
            <Pressable onPress={() => setSelectedMacro(null)} className="active:opacity-70">
              <Text className="text-2xl text-foreground">✕</Text>
            </Pressable>
          </View>

          <Text className="text-base text-muted">{selectedMacro.description}</Text>

          <View className="gap-2 bg-surface rounded-lg p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Rating</Text>
              <Text className="text-sm font-semibold text-foreground">
                ★ {selectedMacro.rating} ({selectedMacro.reviews} reviews)
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Downloads</Text>
              <Text className="text-sm font-semibold text-foreground">{selectedMacro.downloads}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted">Category</Text>
              <Text className="text-sm font-semibold text-foreground capitalize">{selectedMacro.category}</Text>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">TAGS</Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedMacro.tags.map((tag: string) => (
                <View key={tag} className="bg-primary/20 rounded-full px-3 py-1">
                  <Text className="text-xs font-semibold text-primary">{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">RATE THIS MACRO</Text>
            <View className="flex-row justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Pressable
                  key={rating}
                  onPress={() => handleRateMacro(selectedMacro, rating)}
                  className="active:opacity-70"
                >
                  <Text className="text-2xl">{'★'}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-2">
            <Pressable
              onPress={() => handleDownloadMacro(selectedMacro)}
              className="bg-primary rounded-lg p-3 active:opacity-80"
            >
              <Text className="text-center font-semibold text-background">Download Macro</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedMacro(null)}
              className="bg-surface border border-border rounded-lg p-3 active:opacity-80"
            >
              <Text className="text-center font-semibold text-foreground">Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Macro Marketplace</Text>
            <Text className="text-base text-muted">Discover and download community macros</Text>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-surface border border-border rounded-lg px-3 py-2">
            <Text className="text-lg text-muted mr-2">🔍</Text>
            <TextInput
              placeholder="Search macros..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Categories */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
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

          {/* Sort */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-muted">SORT BY</Text>
            <View className="flex-row gap-2">
              {['downloads', 'rating', 'newest'].map((sort) => (
                <Pressable
                  key={sort}
                  onPress={() => setSortBy(sort)}
                  className={cn(
                    'rounded-lg px-3 py-2 active:opacity-80',
                    sortBy === sort ? 'bg-primary' : 'bg-surface border border-border'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs font-semibold capitalize',
                      sortBy === sort ? 'text-background' : 'text-foreground'
                    )}
                  >
                    {sort}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Macros List */}
          {isLoading ? (
            <View className="py-8 items-center">
              <Text className="text-muted">Loading macros...</Text>
            </View>
          ) : filteredMacros.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={filteredMacros}
              keyExtractor={(item) => item.id}
              renderItem={renderMacroCard}
            />
          ) : (
            <View className="py-8 items-center">
              <Text className="text-muted">No macros found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Macro Detail Modal */}
      {renderMacroDetail()}
    </ScreenContainer>
  );
}
