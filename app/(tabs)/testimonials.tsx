import { ScrollView, View, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Card } from '@/components/ui/card';

const RECEIPT_ITEMS = [
  {
    title: 'Real users',
    body: 'Customer quotes belong here after they come from actual feedback.',
    icon: 'chatbubbles',
  },
  {
    title: 'Real numbers',
    body: 'Usage, uptime, and performance claims should be added only when they can be verified.',
    icon: 'analytics',
  },
  {
    title: 'Real proof',
    body: 'Security, compliance, and support claims should stay documented and current.',
    icon: 'shield-checkmark',
  },
];

export default function TestimonialsScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">
            RECEIPTS
          </Text>
          <Text className="text-4xl font-bold text-background mb-2">Proof Comes First</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            This page is reserved for verified product evidence. Until then, it stays clean.
          </Text>
        </View>

        <View className="px-6 py-8">
          <Text className="text-2xl font-bold text-foreground mb-4">What belongs here</Text>
          {RECEIPT_ITEMS.map((item) => (
            <Card key={item.title} variant="elevated" className="mb-4 border border-border">
              <View className="flex-row items-start gap-3">
                <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                  <Ionicons name={item.icon as any} size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground mb-2">{item.title}</Text>
                  <Text className="text-sm text-muted leading-relaxed">{item.body}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-2">Rule of the room</Text>
          <Text className="text-sm text-muted leading-relaxed">
            Evidence first. Polish second. When the product earns real wins, this page can show
            them.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
