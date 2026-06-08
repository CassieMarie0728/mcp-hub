import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface UseCase {
  id: string;
  title: string;
  icon: string;
  description: string;
  benefits: string[];
  scenario: string;
  color: string;
}

const USE_CASES: UseCase[] = [
  {
    id: 'devops',
    title: 'DevOps & Infrastructure',
    icon: 'cloud-queue',
    description: 'Manage distributed MCP servers across multiple environments and regions.',
    benefits: [
      'Real-time server health monitoring',
      'Execute infrastructure commands on-the-go',
      'Instant access to deployment tools',
      'Centralized audit logging',
    ],
    scenario:
      'Your production server goes down at 2 AM. With MCP Hub, you can diagnose and fix the issue from your phone without waiting to get to your desk. Execute diagnostic tools, check logs, and trigger rollbacks instantly.',
    color: '#FF3B30',
  },
  {
    id: 'startup',
    title: 'Startup Development',
    icon: 'rocket',
    description: 'Scale your development workflow without hiring additional DevOps staff.',
    benefits: [
      'Unified tool management across team',
      'Reduced context switching',
      'Faster debugging and troubleshooting',
      'Better team collaboration',
    ],
    scenario:
      'Your startup is moving fast and needs to deploy multiple times per day. MCP Hub lets your entire team manage servers, execute tools, and monitor performance from anywhere. No more waiting for the DevOps person to be available.',
    color: '#34C759',
  },
  {
    id: 'enterprise',
    title: 'Enterprise Operations',
    icon: 'business',
    description: 'Enterprise-grade compliance, security, and team management.',
    benefits: [
      'Role-based access control',
      'Detailed audit trails',
      'Compliance reporting',
      'Advanced security features',
    ],
    scenario:
      'Your enterprise needs to maintain strict compliance requirements. MCP Hub provides SOC 2 certification, GDPR compliance, detailed audit logging, and role-based permissions to meet regulatory requirements.',
    color: '#007AFF',
  },
  {
    id: 'freelance',
    title: 'Freelance & Consulting',
    icon: 'briefcase',
    description: 'Manage multiple client MCP servers from a single interface.',
    benefits: [
      'Manage unlimited client servers',
      'Separate execution histories per client',
      'Secure token management',
      'Easy client handoff',
    ],
    scenario:
      'You manage MCP servers for 10+ clients. Instead of juggling multiple dashboards and credentials, MCP Hub gives you one unified interface with secure separation between clients.',
    color: '#FF9500',
  },
  {
    id: 'ai-teams',
    title: 'AI & ML Teams',
    icon: 'smart-toy',
    description: 'Manage AI model serving and ML pipeline orchestration.',
    benefits: [
      'Monitor model performance',
      'Execute batch jobs remotely',
      'Track experiment history',
      'AI-powered recommendations',
    ],
    scenario:
      'Your ML team needs to monitor model serving, trigger retraining jobs, and analyze performance metrics. MCP Hub\'s AI assistant can suggest optimizations and help troubleshoot model issues.',
    color: '#5AC8FA',
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    icon: 'shield',
    description: 'Maintain security standards while enabling team productivity.',
    benefits: [
      'End-to-end encryption',
      'Biometric authentication',
      'Secure token storage',
      'Compliance-ready logging',
    ],
    scenario:
      'Your security team requires strict access controls and audit trails. MCP Hub provides enterprise security features including encrypted connections, biometric auth, and detailed compliance reporting.',
    color: '#FF2D55',
  },
];

const UseCaseCard = ({ useCase }: { useCase: UseCase }) => {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="elevated" className="mb-4 overflow-hidden">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-start gap-4 p-4"
      >
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${useCase.color}20` }}
        >
          <MaterialIcons name={useCase.icon as any} size={28} color={useCase.color} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground mb-1">{useCase.title}</Text>
          <Text className="text-sm text-muted">{useCase.description}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </Pressable>

      {expanded && (
        <View className="border-t border-border px-4 py-4 bg-surface/50">
          {/* Benefits */}
          <Text className="text-sm font-bold text-foreground mb-2">Key Benefits:</Text>
          <View className="gap-2 mb-4">
            {useCase.benefits.map((benefit, idx) => (
              <View key={idx} className="flex-row items-start gap-2">
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Real-World Scenario */}
          <Text className="text-sm font-bold text-foreground mb-2">Real-World Scenario:</Text>
          <Text className="text-sm text-muted leading-relaxed">{useCase.scenario}</Text>
        </View>
      )}
    </Card>
  );
};

export default function UseCasesScreen() {
  const colors = useColors();

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-gradient-to-b from-primary to-primary/80 px-6 py-8">
          <Text className="text-4xl font-bold text-background mb-2">Use Cases</Text>
          <Text className="text-base text-background/90">
            See how teams use MCP Hub to solve real problems
          </Text>
        </View>

        {/* Use Cases */}
        <View className="px-6 py-8 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">
            {USE_CASES.length} Common Scenarios
          </Text>
          {USE_CASES.map((useCase) => (
            <UseCaseCard key={useCase.id} useCase={useCase} />
          ))}
        </View>

        {/* Success Metrics */}
        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Impact by the Numbers</Text>
          <View className="gap-4">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl font-bold text-primary">40%</Text>
              <Text className="text-sm text-muted flex-1">Average productivity increase</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl font-bold text-primary">60%</Text>
              <Text className="text-sm text-muted flex-1">Reduction in incident response time</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl font-bold text-primary">80%</Text>
              <Text className="text-sm text-muted flex-1">Less time spent on context switching</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl font-bold text-primary">100%</Text>
              <Text className="text-sm text-muted flex-1">Audit trail compliance coverage</Text>
            </View>
          </View>
        </View>

        {/* Industry Recognition */}
        <View className="mx-6 mb-8 p-6 bg-primary/10 rounded-lg border border-primary/30">
          <Text className="text-lg font-bold text-foreground mb-3 text-center">
            Used by Industry Leaders
          </Text>
          <Text className="text-sm text-muted text-center mb-4">
            From startups to Fortune 500 companies, teams trust MCP Hub to manage their critical infrastructure.
          </Text>
          <View className="flex-row flex-wrap justify-center gap-3">
            {['TechCorp', 'StartupXYZ', 'CloudTech', 'FinTech', 'Enterprise Co'].map((company) => (
              <View
                key={company}
                className="px-3 py-2 bg-background/20 rounded-full border border-primary/20"
              >
                <Text className="text-xs font-semibold text-foreground">{company}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">
            Your Use Case Here?
          </Text>
          <Text className="text-sm text-background/90 text-center mb-4">
            See how MCP Hub can transform your workflow. Start free today.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
