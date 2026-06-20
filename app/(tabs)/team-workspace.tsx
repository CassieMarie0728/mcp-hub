import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

export default function TeamWorkspaceScreen() {
  const colors = useColors();
  const [members] = useState([
    { id: "1", name: "You", role: "owner", email: "workspace owner" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

  const roles = [
    { id: "owner", label: "Owner", description: "Controls workspace settings and access." },
    { id: "builder", label: "Builder", description: "Can create and edit workflows." },
    { id: "viewer", label: "Viewer", description: "Can review activity without changing settings." },
  ];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          <View className="gap-2 bg-primary rounded-2xl p-5">
            <Text className="text-xs font-bold tracking-widest text-background/70">TEAM STACK</Text>
            <Text className="text-3xl font-bold text-background">Shared control, cleaner access</Text>
            <Text className="text-sm text-background/80 leading-relaxed">
              Team access should be clear, limited, and easy to review.
            </Text>
          </View>

          <View className="gap-3 bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground">Invite someone</Text>
            <Text className="text-xs text-muted leading-relaxed">
              Add people when roles and permissions are ready to enforce cleanly.
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                placeholder="email@example.com"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                className="flex-1 bg-background text-foreground p-3 rounded-lg border border-border"
                placeholderTextColor={colors.muted}
              />
              <Pressable style={{ backgroundColor: colors.primary }} className="px-4 py-3 rounded-lg items-center justify-center">
                <Text className="text-background font-semibold">Invite</Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Workspace members ({members.length})</Text>
            {members.map((member) => (
              <View key={member.id} className="bg-surface rounded-xl p-4 flex-row items-center justify-between border border-border">
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

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Role map</Text>
            {roles.map((role) => (
              <View key={role.id} className="bg-surface rounded-xl p-3 flex-row items-start gap-3 border border-border">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{role.label}</Text>
                  <Text className="text-xs text-muted mt-1 leading-relaxed">{role.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
