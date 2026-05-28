import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useState } from 'react';

export default function TeamWorkspaceScreen() {
  const colors = useColors();
  const [members, setMembers] = useState([
    { id: '1', name: 'You', role: 'admin', email: 'you@example.com' },
    { id: '2', name: 'John Doe', role: 'editor', email: 'john@example.com' },
    { id: '3', name: 'Jane Smith', role: 'viewer', email: 'jane@example.com' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');

  const roles = [
    { id: 'admin', label: 'Admin', description: 'Full access' },
    { id: 'editor', label: 'Editor', description: 'Can edit workflows' },
    { id: 'viewer', label: 'Viewer', description: 'Read-only access' },
  ];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Team Workspace</Text>
            <Text className="text-sm text-muted">Manage team members and permissions</Text>
          </View>

          {/* Invite Section */}
          <View className="gap-3 bg-surface rounded-2xl p-4">
            <Text className="text-sm font-semibold text-foreground">Invite Team Member</Text>
            <View className="flex-row gap-2">
              <TextInput
                placeholder="email@example.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                className="flex-1 bg-background text-foreground p-3 rounded-lg"
                placeholderTextColor={colors.muted}
              />
              <Pressable
                style={{ backgroundColor: colors.primary }}
                className="px-4 py-3 rounded-lg items-center justify-center"
              >
                <Text className="text-background font-semibold">Invite</Text>
              </Pressable>
            </View>
          </View>

          {/* Members List */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              Team Members ({members.length})
            </Text>
            {members.map((member) => (
              <View
                key={member.id}
                className="bg-surface rounded-xl p-4 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{member.name}</Text>
                  <Text className="text-xs text-muted mt-1">{member.email}</Text>
                </View>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-primary">{member.role}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Roles Reference */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Role Permissions</Text>
            {roles.map((role) => (
              <View key={role.id} className="bg-surface rounded-xl p-3 flex-row items-start gap-3">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{role.label}</Text>
                  <Text className="text-xs text-muted mt-1">{role.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
