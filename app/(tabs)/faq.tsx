import { ScrollView, View, Pressable , Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Card } from '@/components/ui/card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'basics' | 'setup' | 'workflows' | 'security' | 'roadmap';
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what-is-mcp',
    question: 'What is an MCP server?',
    answer: 'An MCP server gives an AI app a structured way to talk to tools, data, and services. MCP Hub is meant to help you keep those connections visible, usable, and easier to manage.',
    category: 'basics',
  },
  {
    id: 'what-is-hub',
    question: 'What is MCP Hub trying to be?',
    answer: 'A mobile-first control room for connected MCP servers, available tools, workflow runs, debugging, and the practical setup work that usually gets scattered everywhere.',
    category: 'basics',
  },
  {
    id: 'first-server',
    question: 'What should I connect first?',
    answer: 'Start with the server that gives you the fastest useful win. GitHub, Slack, Notion, or any custom MCP endpoint is a good candidate if it supports the actions you actually need.',
    category: 'setup',
  },
  {
    id: 'credentials',
    question: 'How should credentials be handled?',
    answer: 'Credentials should be treated as sensitive. Add only what the server needs, keep access narrow when possible, and rotate anything that looks questionable.',
    category: 'security',
  },
  {
    id: 'workflow',
    question: 'What counts as a workflow?',
    answer: 'A workflow is a repeatable chain of actions. It might check issues, send a message, update a record, run a tool, or combine several steps into one cleaner process.',
    category: 'workflows',
  },
  {
    id: 'dry-run',
    question: 'Why test a workflow first?',
    answer: 'Testing shows what the workflow plans to do before it matters. That makes failures easier to catch, explain, and fix.',
    category: 'workflows',
  },
  {
    id: 'pricing',
    question: 'Are pricing plans final?',
    answer: 'Not yet. The pricing page is a roadmap until the product model is final. Real plan details should be added only when they are current and accurate.',
    category: 'roadmap',
  },
  {
    id: 'teams',
    question: 'Will team features exist?',
    answer: 'Team features are part of the product direction: shared workflows, roles, audit views, and cleaner handoff between people. The exact feature set still needs to match the real build.',
    category: 'roadmap',
  },
  {
    id: 'ai-assistant',
    question: 'What should the AI assistant help with?',
    answer: 'It should help route you to the right tool, explain results, suggest next steps, and reduce setup friction without pretending it can replace careful review.',
    category: 'workflows',
  },
];

const FAQAccordion = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  const colors = useColors();

  return (
    <Card variant="elevated" className="mb-3 overflow-hidden border border-border">
      <Pressable onPress={onToggle} className="p-4 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">{item.question}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={colors.primary} />
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQItem['category'] | 'all'>('all');

  const categories: { id: FAQItem['category'] | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'basics', label: 'Basics' },
    { id: 'setup', label: 'Setup' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'security', label: 'Security' },
    { id: 'roadmap', label: 'Roadmap' },
  ];

  const filteredFAQ = selectedCategory === 'all' ? FAQ_ITEMS : FAQ_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">FIELD MANUAL</Text>
          <Text className="text-4xl font-bold text-background mb-2">Help Without the Fog</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            Plain answers for what the hub does now, what it is aiming at, and what still needs to be wired cleanly.
          </Text>
        </View>

        <View className="px-6 py-6 gap-3">
          <Text className="text-sm font-semibold text-muted">Filter by category:</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? 'bg-primary' : 'bg-surface border border-border'}`}
              >
                <Text className={`text-sm font-semibold ${selectedCategory === cat.id ? 'text-background' : 'text-foreground'}`}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">{filteredFAQ.length} answers</Text>
          {filteredFAQ.map((item) => (
            <FAQAccordion key={item.id} item={item} isOpen={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
          ))}
        </View>

        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-2">Need more detail?</Text>
          <Text className="text-sm text-muted leading-relaxed">
            Use the assistant for setup guidance, workflow planning, or debugging notes. Keep final decisions grounded in the actual server behavior.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
