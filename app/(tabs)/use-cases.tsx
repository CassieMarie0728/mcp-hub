import { ScrollView, View, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Text } from 'react-native';
import { Card } from '@/components/ui/card';

interface Mission {
  id: string;
  title: string;
  icon: string;
  description: string;
  moves: string[];
  fieldNote: string;
  color: string;
}

const MISSIONS: Mission[] = [
  {
    id: 'repo-control',
    title: 'Repo Control Room',
    icon: 'source-branch',
    description: 'Keep GitHub work close: issues, pull requests, actions, and release chores in one operating view.',
    moves: ['Check repository status', 'Open or review issues', 'Track workflow results', 'Send updates without tab hopping'],
    fieldNote: 'For the days when the code is fine, the process is not, and you need a clean command path.',
    color: '#981518',
  },
  {
    id: 'ops-check',
    title: 'Ops Check',
    icon: 'cloud-queue',
    description: 'Watch connected systems, test links, and see which tools are ready before you trust them with real work.',
    moves: ['Scan connected servers', 'Test service connections', 'Review execution history', 'Spot broken links early'],
    fieldNote: 'Less guessing. More signal. Fewer unpleasant little surprises.',
    color: '#F59E0B',
  },
  {
    id: 'workflow-builder',
    title: 'Workflow Forge',
    icon: 'build',
    description: 'Turn repeated steps into reusable workflows that can be tested, saved, scheduled, and improved.',
    moves: ['Build multi-step macros', 'Add conditions and loops', 'Run dry checks', 'Save the useful ones'],
    fieldNote: 'If you have done the same task three times, the machine can start carrying part of that load.',
    color: '#22C55E',
  },
  {
    id: 'client-work',
    title: 'Client Stack Wrangler',
    icon: 'briefcase',
    description: 'Keep different client or project systems separated while still working from one hub.',
    moves: ['Name each server clearly', 'Keep histories readable', 'Group tools by purpose', 'Hand off cleaner notes'],
    fieldNote: 'Useful when your projects multiply like gremlins and every one of them has its own tool pile.',
    color: '#5AC8FA',
  },
  {
    id: 'ai-helper',
    title: 'AI Co-Pilot',
    icon: 'smart-toy',
    description: 'Use the assistant to find the right tool, explain what happened, and guide the next move.',
    moves: ['Ask what tool fits the job', 'Summarize execution output', 'Troubleshoot failed runs', 'Draft the next action'],
    fieldNote: 'Not magic. Not glitter. Just a second brain with a flashlight.',
    color: '#a8a9ad',
  },
];

const MissionCard = ({ mission }: { mission: Mission }) => {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="elevated" className="mb-4 overflow-hidden border border-border">
      <Pressable onPress={() => setExpanded(!expanded)} className="flex-row items-start gap-4 p-4">
        <View className="w-12 h-12 rounded-lg items-center justify-center" style={{ backgroundColor: `${mission.color}20` }}>
          <MaterialIcons name={mission.icon as any} size={28} color={mission.color} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground mb-1">{mission.title}</Text>
          <Text className="text-sm text-muted leading-relaxed">{mission.description}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
      </Pressable>

      {expanded && (
        <View className="border-t border-border px-4 py-4 bg-surface/50">
          <Text className="text-sm font-bold text-foreground mb-2">Moves:</Text>
          <View className="gap-2 mb-4">
            {mission.moves.map((move) => (
              <View key={move} className="flex-row items-start gap-2">
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text className="text-sm text-foreground flex-1">{move}</Text>
              </View>
            ))}
          </View>
          <Text className="text-sm font-bold text-foreground mb-2">Field note:</Text>
          <Text className="text-sm text-muted leading-relaxed">{mission.fieldNote}</Text>
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
        <View className="bg-primary px-6 py-8">
          <Text className="text-xs text-background/70 font-bold tracking-widest mb-2">MISSIONS</Text>
          <Text className="text-4xl font-bold text-background mb-2">What You Can Actually Do</Text>
          <Text className="text-base text-background/90 leading-relaxed">
            No inflated case-study theater. Just practical ways this hub can help you control the tool pile.
          </Text>
        </View>

        <View className="px-6 py-8 pb-8">
          <Text className="text-lg font-bold text-foreground mb-4">{MISSIONS.length} mission types</Text>
          {MISSIONS.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </View>

        <View className="mx-6 mb-8 p-6 bg-surface rounded-lg border border-border">
          <Text className="text-lg font-bold text-foreground mb-3">The point</Text>
          <Text className="text-sm text-muted leading-relaxed">
            MCP Hub is not here to decorate your workflow. It is here to make scattered tools easier to connect, run, inspect, and improve.
          </Text>
        </View>

        <View className="mx-6 mb-8 p-6 bg-primary rounded-lg">
          <Text className="text-lg font-bold text-background mb-2 text-center">Bring your own chaos.</Text>
          <Text className="text-sm text-background/90 text-center">
            Connect the first server, test the first tool, and start turning the mess into a system.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
