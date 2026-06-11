import { ScrollView, View } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

interface Stat {
  label: string;
  value: string;
  icon: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Chen',
    role: 'DevOps Engineer',
    company: 'TechCorp',
    content:
      'MCP Hub has been a game-changer for managing our distributed MCP servers. What used to take 30 minutes now takes 30 seconds. The mobile interface is intuitive and the AI assistant is incredibly helpful.',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    id: '2',
    name: 'Sarah Martinez',
    role: 'CTO',
    company: 'StartupXYZ',
    content:
      'We switched from managing individual MCP servers to using MCP Hub, and our team productivity increased by 40%. The real-time monitoring and execution history have been invaluable for debugging and optimization.',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    id: '3',
    name: 'James Wilson',
    role: 'Full Stack Developer',
    company: 'Enterprise Solutions',
    content:
      'The security features are top-notch. Biometric authentication, encrypted connections, and secure token management give me peace of mind. I can manage production servers from my phone without worrying about security.',
    rating: 5,
    avatar: '👨‍🔧',
  },
  {
    id: '4',
    name: 'Emma Thompson',
    role: 'Platform Lead',
    company: 'CloudTech Inc',
    content:
      'MCP Hub\'s AI assistant has saved our team countless hours. It proactively suggests optimizations, helps troubleshoot issues, and provides intelligent recommendations based on our usage patterns. Absolutely incredible.',
    rating: 5,
    avatar: '👩‍💻',
  },
  {
    id: '5',
    name: 'David Park',
    role: 'Infrastructure Manager',
    company: 'FinTech Solutions',
    content:
      'The execution history and detailed logging have been crucial for compliance and auditing. The ability to export data and set custom retention policies makes it perfect for regulated industries.',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    role: 'Freelance Developer',
    company: 'Independent',
    content:
      'As a solo developer managing multiple client MCP servers, MCP Hub has been a lifesaver. The free tier is generous, and the Pro plan is worth every penny. Best investment I\'ve made for my workflow.',
    rating: 5,
    avatar: '👩‍💻',
  },
];

const STATS: Stat[] = [
  { label: 'Active Users', value: '5,000+', icon: 'people' },
  { label: 'MCP Servers Managed', value: '25,000+', icon: 'server' },
  { label: 'Tool Executions', value: '2M+', icon: 'flash' },
  { label: 'Uptime', value: '99.9%', icon: 'checkmark-circle' },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  const colors = useColors();

  return (
    <Card variant="elevated" className="mb-4">
      {/* Rating */}
      <View className="flex-row gap-1 mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Ionicons key={i} name="star" size={16} color="#FFD700" />
        ))}
      </View>

      {/* Testimonial Text */}
      <Text className="text-sm text-foreground mb-4 leading-relaxed italic">
        &quot;{testimonial.content}&quot;
      </Text>

      {/* Author */}
      <View className="flex-row items-center gap-3 pt-3 border-t border-border">
        <Text className="text-2xl">{testimonial.avatar}</Text>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{testimonial.name}</Text>
          <Text className="text-xs text-muted">
            {testimonial.role} at {testimonial.company}
          </Text>
        </View>
      </View>
    </Card>
  );
};

export default function TestimonialsScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">Loved by Developers</Text>
          <Text className="text-base text-background/90">
            Join thousands of developers trusting MCP Hub
          </Text>
        </View>

        {/* Stats Section */}
        <View className="px-6 py-8">
          <View className="gap-3">
            {STATS.map((stat, idx) => (
              <View key={idx} className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                  <Ionicons name={stat.icon as any} size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-foreground">{stat.value}</Text>
                  <Text className="text-xs text-muted">{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View className="px-6 pb-8">
          <Text className="text-2xl font-bold text-foreground mb-4">What Users Say</Text>
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </View>

        {/* Trust Badges */}
        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-4 text-center">
            Trusted by Industry Leaders
          </Text>
          <View className="gap-3">
            <View className="flex-row items-center gap-2 justify-center">
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text className="text-sm text-foreground">SOC 2 Type II Certified</Text>
            </View>
            <View className="flex-row items-center gap-2 justify-center">
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text className="text-sm text-foreground">GDPR & CCPA Compliant</Text>
            </View>
            <View className="flex-row items-center gap-2 justify-center">
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text className="text-sm text-foreground">Enterprise-Grade Security</Text>
            </View>
            <View className="flex-row items-center gap-2 justify-center">
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
              <Text className="text-sm text-foreground">99.9% Uptime SLA</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">
            Ready to Join Them?
          </Text>
          <Text className="text-sm text-background/90 text-center mb-4">
            Start managing your MCP servers like a pro. Free tier, no credit card required.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 bg-background/20 rounded-lg px-4 py-2">
              <Text className="text-xs text-background text-center font-semibold">
                Get Started Free
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
