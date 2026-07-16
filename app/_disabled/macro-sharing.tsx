import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
// import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Sharing Screen
 * Manage permissions, invitations, and share links
 */
export default function MacroSharingScreen() {
  // const router = useRouter();
  const colors = useColors();

  const [tab, setTab] = useState<'permissions' | 'invitations' | 'links'>('permissions');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'execute' | 'edit'>('view');
  const [expirationDays, setExpirationDays] = useState('30');

  // Mock data
  const permissions = [
    {
      id: '1',
      user: 'john@example.com',
      level: 'view',
      expiresAt: '2026-04-30',
      granted: '2026-03-30',
    },
    {
      id: '2',
      user: 'jane@example.com',
      level: 'edit',
      expiresAt: '2026-05-15',
      granted: '2026-03-20',
    },
  ];

  const invitations = [
    {
      id: '1',
      email: 'bob@example.com',
      level: 'execute',
      status: 'pending',
      sentAt: '2026-03-28',
    },
    {
      id: '2',
      email: 'alice@example.com',
      level: 'view',
      status: 'accepted',
      acceptedAt: '2026-03-29',
    },
  ];

  const shareLinks = [
    { id: '1', token: 'ABC123XYZ', level: 'view', created: '2026-03-25', uses: 5, maxUses: 10 },
    {
      id: '2',
      token: 'DEF456UVW',
      level: 'execute',
      created: '2026-03-28',
      uses: 0,
      maxUses: null,
    },
  ];

  /**
   * Send invitation
   */
  const handleSendInvitation = () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Empty email', 'Please enter an email address');
      return;
    }

    Alert.alert('Invitation sent', `Invited ${inviteEmail} with ${selectedPermission} permission`);
    setInviteEmail('');
  };

  /**
   * Revoke permission
   */
  const handleRevokePermission = (id: string) => {
    Alert.alert('Revoke permission?', 'This action cannot be undone.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Revoke',
        onPress: () => Alert.alert('Revoked', 'Permission has been revoked'),
        style: 'destructive',
      },
    ]);
  };

  /**
   * Copy share link
   */
  const handleCopyLink = (token: string) => {
    Alert.alert('Link copied', `Share link copied to clipboard: ${token}`);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Share Macro</Text>
            <Text className="text-base text-muted">Manage permissions and access</Text>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2 bg-surface rounded-lg p-1 border border-border">
            {(['permissions', 'invitations', 'links'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-md p-3 active:opacity-80',
                  tab === t ? 'bg-primary' : 'bg-transparent',
                )}
              >
                <Text
                  className={cn(
                    'text-center font-semibold text-xs',
                    tab === t ? 'text-background' : 'text-foreground',
                  )}
                >
                  {t === 'permissions' && '🔐 Active'}
                  {t === 'invitations' && '📧 Invites'}
                  {t === 'links' && '🔗 Links'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Permissions Tab */}
          {tab === 'permissions' && (
            <View className="gap-4">
              {/* Invite Section */}
              <View className="bg-surface rounded-lg p-4 border border-border gap-3">
                <Text className="font-semibold text-foreground text-sm">NEW PERMISSION</Text>

                <TextInput
                  placeholder="Email address"
                  placeholderTextColor={colors.muted}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  className="bg-background border border-border rounded-lg p-3 text-foreground"
                  style={{ color: colors.foreground }}
                />

                <View className="gap-2">
                  <Text className="text-xs font-semibold text-muted">PERMISSION LEVEL</Text>
                  <View className="flex-row gap-2">
                    {(['view', 'execute', 'edit'] as const).map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => setSelectedPermission(level)}
                        className={cn(
                          'flex-1 rounded-lg p-2 active:opacity-80',
                          selectedPermission === level
                            ? 'bg-primary'
                            : 'bg-background border border-border',
                        )}
                      >
                        <Text
                          className={cn(
                            'text-center font-semibold text-xs',
                            selectedPermission === level ? 'text-background' : 'text-foreground',
                          )}
                        >
                          {level === 'view' && '👁️ View'}
                          {level === 'execute' && '▶️ Execute'}
                          {level === 'edit' && '✏️ Edit'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-xs font-semibold text-muted">EXPIRES IN (DAYS)</Text>
                  <TextInput
                    placeholder="30"
                    placeholderTextColor={colors.muted}
                    value={expirationDays}
                    onChangeText={setExpirationDays}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                    style={{ color: colors.foreground }}
                  />
                </View>

                <Pressable
                  onPress={handleSendInvitation}
                  className="bg-primary rounded-lg p-3 active:opacity-80"
                >
                  <Text className="text-center font-semibold text-background">Send Invitation</Text>
                </Pressable>
              </View>

              {/* Active Permissions */}
              <View className="gap-2">
                <Text className="font-semibold text-foreground text-sm">ACTIVE PERMISSIONS</Text>
                {permissions.map((perm) => (
                  <View
                    key={perm.id}
                    className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-1 gap-1">
                      <Text className="font-semibold text-foreground text-sm">{perm.user}</Text>
                      <View className="flex-row gap-2 items-center">
                        <Text className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">
                          {perm.level.toUpperCase()}
                        </Text>
                        <Text className="text-xs text-muted">Expires {perm.expiresAt}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleRevokePermission(perm.id)}
                      className="p-2 active:opacity-80"
                    >
                      <Text className="text-error font-semibold text-sm">Revoke</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Invitations Tab */}
          {tab === 'invitations' && (
            <View className="gap-2">
              {invitations.map((inv) => (
                <View
                  key={inv.id}
                  className="bg-surface rounded-lg p-3 border border-border flex-row items-center justify-between"
                >
                  <View className="flex-1 gap-1">
                    <Text className="font-semibold text-foreground text-sm">{inv.email}</Text>
                    <View className="flex-row gap-2 items-center">
                      <Text className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">
                        {inv.level.toUpperCase()}
                      </Text>
                      <Text
                        className={cn(
                          'text-xs font-semibold px-2 py-1 rounded',
                          inv.status === 'pending'
                            ? 'bg-warning/20 text-warning'
                            : 'bg-success/20 text-success',
                        )}
                      >
                        {inv.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Share Links Tab */}
          {tab === 'links' && (
            <View className="gap-4">
              <Pressable className="bg-primary rounded-lg p-4 active:opacity-80">
                <Text className="text-center font-semibold text-background">
                  + Create Share Link
                </Text>
              </Pressable>

              <View className="gap-2">
                <Text className="font-semibold text-foreground text-sm">ACTIVE LINKS</Text>
                {shareLinks.map((link) => (
                  <View
                    key={link.id}
                    className="bg-surface rounded-lg p-3 border border-border gap-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-mono text-xs font-semibold text-primary">
                        {link.token}
                      </Text>
                      <Text className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-semibold">
                        {link.level.toUpperCase()}
                      </Text>
                    </View>

                    <Text className="text-xs text-muted">
                      Uses: {link.uses}/{link.maxUses || '∞'}
                    </Text>

                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleCopyLink(link.token)}
                        className="flex-1 bg-primary/20 rounded-lg p-2 active:opacity-80"
                      >
                        <Text className="text-center font-semibold text-primary text-xs">Copy</Text>
                      </Pressable>

                      <Pressable className="flex-1 bg-error/20 rounded-lg p-2 active:opacity-80">
                        <Text className="text-center font-semibold text-error text-xs">Revoke</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Back Button */}
          <Pressable
            onPress={() => Alert.alert('Go back', 'Navigation not available in this view')}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80 mt-4"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
