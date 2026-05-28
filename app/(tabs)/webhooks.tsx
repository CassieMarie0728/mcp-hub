import { ScrollView, Text, View, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Webhook {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  events: string[];
  rateLimit: number;
  executionCount: number;
  failureCount: number;
  lastTriggeredAt?: Date;
}

export default function WebhooksScreen() {
  const colors = useColors();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const mockWebhooks: Webhook[] = [
    {
      id: 'wh_001',
      name: 'GitHub Push Events',
      url: 'https://api.mcphub.io/webhooks/wh_001',
      isActive: true,
      events: ['push', 'pull_request'],
      rateLimit: 60,
      executionCount: 245,
      failureCount: 3,
      lastTriggeredAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'wh_002',
      name: 'Slack Events',
      url: 'https://api.mcphub.io/webhooks/wh_002',
      isActive: true,
      events: ['message', 'reaction'],
      rateLimit: 120,
      executionCount: 512,
      failureCount: 8,
      lastTriggeredAt: new Date(Date.now() - 600000),
    },
  ];

  useEffect(() => {
    setWebhooks(mockWebhooks);
  }, []);

  const handleCreateWebhook = () => {
    if (!webhookName.trim() || selectedEvents.length === 0) {
      Alert.alert('Error', 'Please enter webhook name and select events');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newWebhook: Webhook = {
        id: `wh_${Date.now()}`,
        name: webhookName,
        url: `https://api.mcphub.io/webhooks/wh_${Date.now()}`,
        isActive: true,
        events: selectedEvents,
        rateLimit: 60,
        executionCount: 0,
        failureCount: 0,
      };

      setWebhooks([...webhooks, newWebhook]);
      setWebhookName('');
      setSelectedEvents([]);
      setShowCreateForm(false);
      setLoading(false);
      Alert.alert('Success', 'Webhook created successfully');
    }, 500);
  };

  const handleCopyUrl = (url: string) => {
    Alert.alert('Webhook URL', url, [
      { text: 'Close', onPress: () => {} },
    ]);
  };

  const handleToggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const availableEvents = ['push', 'pull_request', 'message', 'reaction', 'update', 'delete'];

  const renderWebhookCard = ({ item }: { item: Webhook }) => {
    const successRate =
      item.executionCount > 0
        ? Math.round(((item.executionCount - item.failureCount) / item.executionCount) * 100)
        : 0;

    return (
      <View
        className="mb-4 rounded-xl p-4 border"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
              <View
                className="px-2 py-1 rounded-full"
                style={{
                  backgroundColor: item.isActive ? colors.success + '20' : colors.error + '20',
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: item.isActive ? colors.success : colors.error }}
                >
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-3 gap-2">
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="link" size={14} color={colors.muted} />
            <Text className="text-xs text-muted flex-1" numberOfLines={1}>
              {item.url}
            </Text>
            <TouchableOpacity onPress={() => handleCopyUrl(item.url)}>
              <MaterialIcons name="content-copy" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-2">
            <MaterialIcons name="event" size={14} color={colors.muted} />
            <Text className="text-xs text-muted">
              {item.events.join(', ')}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="check-circle" size={14} color={colors.success} />
              <Text className="text-xs text-muted">
                {successRate}% success rate ({item.executionCount} executions)
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text style={{ color: colors.primary }} className="text-sm font-semibold">
              View Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: colors.error + '20' }}
          >
            <Text style={{ color: colors.error }} className="text-sm font-semibold">
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-3xl font-bold text-foreground">Webhooks</Text>
              <Text className="text-sm text-muted">Trigger workflows from external systems</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreateForm(!showCreateForm)}
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
            >
              <MaterialIcons name="add" size={24} color={colors.background} />
            </TouchableOpacity>
          </View>

          {/* Create Form */}
          {showCreateForm && (
            <View
              className="p-4 rounded-xl border gap-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <Text className="text-lg font-semibold text-foreground">Create Webhook</Text>

              <TextInput
                placeholder="Webhook name"
                placeholderTextColor={colors.muted}
                value={webhookName}
                onChangeText={setWebhookName}
                className="px-3 py-2 rounded-lg border text-foreground"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }}
              />

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Select Events</Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableEvents.map((event) => (
                    <TouchableOpacity
                      key={event}
                      onPress={() => handleToggleEvent(event)}
                      className={`px-3 py-2 rounded-full border ${
                        selectedEvents.includes(event) ? 'bg-primary' : ''
                      }`}
                      style={{
                        borderColor: selectedEvents.includes(event) ? colors.primary : colors.border,
                        backgroundColor: selectedEvents.includes(event)
                          ? colors.primary
                          : colors.background,
                      }}
                    >
                      <Text
                        style={{
                          color: selectedEvents.includes(event) ? colors.background : colors.foreground,
                        }}
                        className="text-xs font-semibold"
                      >
                        {event}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setShowCreateForm(false)}
                  className="flex-1 py-2 px-4 rounded-lg items-center"
                  style={{ backgroundColor: colors.border }}
                >
                  <Text className="font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateWebhook}
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-lg items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="font-semibold text-background">
                    {loading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Webhooks List */}
          {webhooks.length > 0 ? (
            <FlatList
              data={webhooks}
              renderItem={renderWebhookCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center justify-center py-8">
              <MaterialIcons name="webhook" size={48} color={colors.muted} />
              <Text className="text-center text-muted mt-2">No webhooks yet</Text>
              <TouchableOpacity
                onPress={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-background font-semibold">Create First Webhook</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
