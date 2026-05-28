import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  rating: number;
  cloneCount: number;
}

export default function WorkflowTemplatesScreen() {
  const colors = useColors();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock templates data
  const mockTemplates: Template[] = [
    {
      id: 'github-to-slack-001',
      name: 'GitHub Issue to Slack',
      description: 'Create a GitHub issue and notify Slack channel',
      category: 'multi-server',
      tags: ['github', 'slack', 'automation'],
      rating: 4.8,
      cloneCount: 245,
    },
    {
      id: 'github-to-notion-001',
      name: 'GitHub PR to Notion',
      description: 'Track GitHub pull requests in Notion database',
      category: 'multi-server',
      tags: ['github', 'notion', 'tracking'],
      rating: 4.6,
      cloneCount: 189,
    },
    {
      id: 'slack-to-github-001',
      name: 'Slack to GitHub Issue',
      description: 'Convert Slack messages to GitHub issues',
      category: 'multi-server',
      tags: ['slack', 'github', 'conversion'],
      rating: 4.5,
      cloneCount: 156,
    },
  ];

  useEffect(() => {
    setTemplates(mockTemplates);
    filterTemplates(mockTemplates, selectedCategory, searchText);
  }, []);

  const filterTemplates = (
    items: Template[],
    category: string | null,
    search: string
  ) => {
    let filtered = items;

    if (category) {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    filterTemplates(templates, category, searchText);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterTemplates(templates, selectedCategory, text);
  };

  const handleCloneTemplate = (template: Template) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert(`Template "${template.name}" cloned successfully!`);
    }, 500);
  };

  const renderTemplateCard = ({ item }: { item: Template }) => (
    <View
      className="mb-4 rounded-xl p-4 border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
          <Text className="text-sm text-muted mt-1">{item.description}</Text>
        </View>
      </View>

      <View className="flex-row items-center mb-3 gap-2">
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="star" size={16} color={colors.warning} />
          <Text className="text-xs text-muted">{item.rating}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="file-copy" size={16} color={colors.primary} />
          <Text className="text-xs text-muted">{item.cloneCount} clones</Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-3">
        {item.tags.map((tag) => (
          <View
            key={tag}
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-xs" style={{ color: colors.primary }}>
              {tag}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => handleCloneTemplate(item)}
        disabled={loading}
        className="py-2 px-4 rounded-lg items-center"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="font-semibold text-background">
          {loading ? 'Cloning...' : 'Clone Template'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const categories = ['multi-server', 'github', 'slack', 'notion'];

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Templates</Text>
            <Text className="text-sm text-muted">
              Pre-built workflows to automate your tasks
            </Text>
          </View>

          {/* Search Bar */}
          <View
            className="flex-row items-center px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }}
          >
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder="Search templates..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={handleSearch}
              className="flex-1 ml-2 text-foreground"
            />
          </View>

          {/* Category Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              <TouchableOpacity
                onPress={() => handleCategoryChange(null)}
                className={`px-4 py-2 rounded-full ${!selectedCategory ? 'bg-primary' : ''}`}
                style={{
                  backgroundColor: !selectedCategory ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  style={{
                    color: !selectedCategory ? colors.background : colors.foreground,
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  className={`px-4 py-2 rounded-full ${selectedCategory === cat ? 'bg-primary' : ''}`}
                  style={{
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text
                    style={{
                      color: selectedCategory === cat ? colors.background : colors.foreground,
                    }}
                    className="capitalize"
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Templates List */}
          {filteredTemplates.length > 0 ? (
            <FlatList
              data={filteredTemplates}
              renderItem={renderTemplateCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center justify-center py-8">
              <MaterialIcons name="inbox" size={48} color={colors.muted} />
              <Text className="text-center text-muted mt-2">No templates found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
