import { ScrollView, View, Text } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useColors } from '@/hooks/use-colors';

const MORE_ROUTES = [
  {
    title: 'Setup',
    description: 'Onboarding and first connection steps.',
    href: '/onboarding',
    icon: 'flag',
  },
  {
    title: 'Team',
    description: 'Workspace members, roles, and access.',
    href: '/team-workspace',
    icon: 'people',
  },
  {
    title: 'Schedules',
    description: 'Recurring workflow timing.',
    href: '/schedule-workflow',
    icon: 'time',
  },
  { title: 'Manual', description: 'Field guide and current FAQ.', href: '/faq', icon: 'book' },
  {
    title: 'Receipts',
    description: 'Proof and evidence placeholders.',
    href: '/testimonials',
    icon: 'receipt',
  },
  {
    title: 'Missions',
    description: 'Practical workflow use cases.',
    href: '/use-cases',
    icon: 'compass',
  },
  { title: 'Plans', description: 'Pricing and packaging roadmap.', href: '/pricing', icon: 'map' },
  {
    title: 'Wires',
    description: 'Connection map and integrations.',
    href: '/integrations',
    icon: 'git-network',
  },
];

export default function MoreScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">MORE</Text>
          <Text className="text-4xl font-bold text-background mb-2">Secondary Screens</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            Extra product areas are grouped here so the main tab bar stays easier to use.
          </Text>
        </View>

        <View className="px-6 py-8">
          {MORE_ROUTES.map((route) => (
            <Link key={route.href} href={route.href as any} asChild>
              <Card variant="elevated" className="mb-4 border border-border">
                <View className="flex-row items-start gap-3">
                  <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                    <Ionicons name={route.icon as any} size={22} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground mb-1">{route.title}</Text>
                    <Text className="text-sm text-muted leading-relaxed">{route.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </View>
              </Card>
            </Link>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
