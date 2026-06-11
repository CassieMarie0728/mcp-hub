import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'technical' | 'security' | 'pricing';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-mcp',
    question: 'What is an MCP Server?',
    answer:
      'MCP (Model Context Protocol) servers are tools that extend the capabilities of AI models and applications. They provide standardized interfaces for connecting to external services, databases, and tools. MCP Hub helps you manage all your MCP servers from one unified interface.',
    category: 'general',
  },
  {
    id: 'why-use-mcp-hub',
    question: 'Why should I use MCP Hub instead of managing servers individually?',
    answer:
      'MCP Hub gives you a centralized dashboard to monitor, manage, and execute tools across all your MCP servers. Instead of juggling multiple interfaces, you get real-time status updates, execution history, and AI-powered assistance—all from your mobile device. It\'s like having a command center in your pocket.',
    category: 'general',
  },
  {
    id: 'mobile-first',
    question: 'Can I really manage production servers from my phone?',
    answer:
      'Absolutely! MCP Hub is built mobile-first with full functionality optimized for on-the-go management. You can monitor server health, execute tools, view execution history, and get alerts—all from your phone or tablet. Perfect for developers who need to stay connected while away from their desk.',
    category: 'technical',
  },
  {
    id: 'how-to-connect',
    question: 'How do I connect my first MCP server?',
    answer:
      'It\'s simple: tap "Add Server" on the home screen, enter your server\'s connection details (URL, API key, or authentication method), and MCP Hub will automatically discover available tools. Once connected, you can start executing tools immediately. We support all standard MCP server configurations.',
    category: 'technical',
  },
  {
    id: 'security',
    question: 'Is my data secure? How do you handle authentication?',
    answer:
      'Security is our top priority. All connections are encrypted end-to-end using industry-standard TLS 1.3. Authentication tokens are stored securely in your device\'s keychain/keystore and never transmitted to our servers. We use OAuth 2.0 for third-party integrations and support biometric authentication (Face ID/fingerprint).',
    category: 'security',
  },
  {
    id: 'offline-mode',
    question: 'Can I use MCP Hub offline?',
    answer:
      'MCP Hub requires an internet connection to communicate with your MCP servers. However, we cache recent execution history and server information locally, so you can view past activity even if temporarily disconnected. Once you\'re back online, all actions sync automatically.',
    category: 'technical',
  },
  {
    id: 'supported-servers',
    question: 'What MCP servers are supported?',
    answer:
      'MCP Hub supports any MCP-compliant server. This includes popular services like GitHub, Slack, Notion, and custom enterprise servers. If your server follows the MCP specification, it will work with MCP Hub. Check our integrations page for a complete list of tested and verified servers.',
    category: 'technical',
  },
  {
    id: 'execution-limits',
    question: 'Are there limits on tool executions?',
    answer:
      'The free tier includes unlimited tool executions with standard rate limiting to prevent abuse. Pro and Enterprise plans have higher rate limits and priority support. All plans include full execution history and monitoring capabilities.',
    category: 'pricing',
  },
  {
    id: 'ai-assistant',
    question: 'How does the AI Assistant work?',
    answer:
      'The AI Assistant uses advanced language models to help you navigate MCP Hub, suggest relevant tools, and provide intelligent recommendations based on your usage patterns. It can answer questions about your servers, help troubleshoot issues, and guide you through complex workflows. All conversations are private and encrypted.',
    category: 'technical',
  },
  {
    id: 'data-retention',
    question: 'How long is my execution history retained?',
    answer:
      'Free tier: 30 days. Pro tier: 90 days. Enterprise tier: 1 year or custom retention policies. You can export your execution history anytime. Deleted history cannot be recovered, so we recommend regular exports for compliance purposes.',
    category: 'security',
  },
  {
    id: 'team-collaboration',
    question: 'Can multiple team members use MCP Hub?',
    answer:
      'Yes! Pro and Enterprise plans support team collaboration. You can invite team members, set role-based permissions (admin, developer, viewer), and track who executed what. Enterprise plans include advanced audit logging and compliance features.',
    category: 'general',
  },
  {
    id: 'api-access',
    question: 'Is there an API for programmatic access?',
    answer:
      'Yes! MCP Hub provides a REST API for Pro and Enterprise plans. You can manage servers, execute tools, and retrieve execution history programmatically. Full API documentation is available in your dashboard. Webhooks are supported for Enterprise customers.',
    category: 'technical',
  },
  {
    id: 'pricing-plans',
    question: 'What are the pricing plans?',
    answer:
      'Free: $0/month - Perfect for individuals. Pro: $29/month - For teams and power users. Enterprise: Custom pricing - For organizations with advanced needs. All plans include mobile apps, real-time monitoring, and AI assistance. No credit card required for free tier.',
    category: 'pricing',
  },
  {
    id: 'cancel-anytime',
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Absolutely! You can cancel your subscription anytime with no penalties or long-term contracts. Your data remains accessible for 30 days after cancellation, giving you time to export if needed. We\'d love to hear why you\'re leaving so we can improve!',
    category: 'pricing',
  },
  {
    id: 'support',
    question: 'What support options are available?',
    answer:
      'Free tier: Community support via Discord. Pro tier: Email support with 24-hour response time. Enterprise: Dedicated support team with 1-hour response time and custom SLAs. All tiers have access to our comprehensive documentation and video tutorials.',
    category: 'general',
  },
];

const FAQAccordion = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  const colors = useColors();

  return (
    <Card variant="elevated" className="mb-3 overflow-hidden">
      <Pressable onPress={onToggle} className="p-4 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{item.question}</Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primary}
        />
      </Pressable>

      {isOpen && (
        <View className="border-t border-border px-4 py-3 bg-surface/50">
          <Text className="text-sm text-muted leading-relaxed">{item.answer}</Text>
        </View>
      )}
    </Card>
  );
};

export default function FAQScreen() {
  const colors = useColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all');

  const categories: Array<{ id: FAQItem['category'] | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'general', label: 'General' },
    { id: 'technical', label: 'Technical' },
    { id: 'security', label: 'Security' },
    { id: 'pricing', label: 'Pricing' },
  ];

  const filteredFAQ =
    selectedCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">FAQ</Text>
          <Text className="text-base text-background/90">
            Everything you need to know about MCP Hub
          </Text>
        </View>

        {/* Category Filter */}
        <View className="px-6 py-6 gap-3">
          <Text className="text-sm font-semibold text-muted">Filter by category:</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === cat.id
                    ? 'bg-primary'
                    : 'bg-surface border border-border'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedCategory === cat.id ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* FAQ Items */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">
            {filteredFAQ.length} questions
          </Text>

          {filteredFAQ.map((item) => (
            <FAQAccordion
              key={item.id}
              item={item}
              isOpen={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
          ))}
        </View>

        {/* Still Have Questions */}
        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-2">Still have questions?</Text>
          <Text className="text-sm text-muted mb-4">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </Text>
          <View className="gap-2">
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="mail" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">support@mcphub.dev</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="logo-discord" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">Join our Discord community</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-2 py-2">
              <Ionicons name="chatbubbles" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">Chat with our AI Assistant</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
