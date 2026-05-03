/**
 * Token Management Screen
 * Secure token registration, rotation, and lifecycle management
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

interface Token {
  id: string;
  serverId: string;
  serverType: string;
  name: string;
  maskedToken: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  scopes?: string[];
}

interface ServerType {
  id: string;
  name: string;
  icon: string;
  authMethod: string;
  docsUrl: string;
}

const SERVER_TYPES: ServerType[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    authMethod: 'Bearer Token',
    docsUrl: 'https://github.com/settings/tokens',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    authMethod: 'Bot Token',
    docsUrl: 'https://api.slack.com/apps',
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'notion',
    authMethod: 'Integration Token',
    docsUrl: 'https://www.notion.so/my-integrations',
  },
];

export default function TokenManagementScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<'register' | 'manage'>('manage');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [newToken, setNewToken] = useState('');

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    setLoading(true);
    try {
      // TODO: Call tRPC listServerTokens for each server
      // For now, using mock data
      setTokens([
        {
          id: '1',
          serverId: 'github-1',
          serverType: 'github',
          name: 'My GitHub Token',
          maskedToken: '••••cdef',
          createdAt: new Date(Date.now() - 86400000 * 30),
          lastUsedAt: new Date(Date.now() - 3600000),
          isActive: true,
        },
        {
          id: '2',
          serverId: 'slack-1',
          serverType: 'slack',
          name: 'Slack Bot Token',
          maskedToken: '••••ghij',
          createdAt: new Date(Date.now() - 86400000 * 7),
          lastUsedAt: new Date(Date.now() - 7200000),
          isActive: true,
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterToken = async () => {
    if (!selectedServer || !tokenInput || !tokenName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call tRPC storeToken
      Alert.alert('Success', `Token "${tokenName}" registered successfully`);
      setTokenInput('');
      setTokenName('');
      setSelectedServer(null);
      setShowTokenInput(false);
      setActiveTab('manage');
      await loadTokens();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register token');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (token: Token) => {
    Alert.alert(
      'Revoke Token',
      `Are you sure you want to revoke "${token.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // TODO: Call tRPC revokeToken
              Alert.alert('Success', 'Token revoked');
              await loadTokens();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to revoke token');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRotateToken = async () => {
    if (!selectedToken || !newToken) {
      Alert.alert('Error', 'Please enter a new token');
      return;
    }

    setLoading(true);
    try {
      // TODO: Call tRPC rotateToken
      Alert.alert('Success', `Token "${selectedToken.name}" rotated successfully`);
      setNewToken('');
      setShowRotateModal(false);
      setSelectedToken(null);
      await loadTokens();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to rotate token');
    } finally {
      setLoading(false);
    }
  };

  const getServerIcon = (serverType: string) => {
    const icons: Record<string, string> = {
      github: 'code',
      slack: 'chat',
      notion: 'storage',
    };
    return icons[serverType] || 'link';
  };

  const getServerColor = (serverType: string) => {
    const colorMap: Record<string, string> = {
      github: '#333333',
      slack: '#E01E5A',
      notion: '#000000',
    };
    return colorMap[serverType] || colors.primary;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScreenContainer className="bg-background">
      {/* Tab Navigation */}
      <View className="flex-row border-b border-border mb-4">
        <TouchableOpacity
          onPress={() => setActiveTab('manage')}
          className={cn(
            'flex-1 py-3 px-4 border-b-2',
            activeTab === 'manage' ? 'border-primary' : 'border-transparent'
          )}
        >
          <Text
            className={cn(
              'text-center font-semibold',
              activeTab === 'manage' ? 'text-primary' : 'text-muted'
            )}
          >
            My Tokens
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('register')}
          className={cn(
            'flex-1 py-3 px-4 border-b-2',
            activeTab === 'register' ? 'border-primary' : 'border-transparent'
          )}
        >
          <Text
            className={cn(
              'text-center font-semibold',
              activeTab === 'register' ? 'text-primary' : 'text-muted'
            )}
          >
            Register Token
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {activeTab === 'manage' ? (
          <View className="flex-1">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            ) : tokens.length === 0 ? (
              <View className="flex-1 items-center justify-center py-8">
                    <MaterialIcons name={"security" as any} size={48} color={colors.muted} />
                <Text className="text-foreground font-semibold mt-4">No Tokens Yet</Text>
                <Text className="text-muted text-center mt-2 px-4">
                  Register your first API token to get started
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {tokens.map((token) => (
                  <Pressable
                    key={token.id}
                    onPress={() => setSelectedToken(token)}
                    className="bg-surface rounded-lg p-4 border border-border"
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1 gap-3">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: getServerColor(token.serverType) + '20' }}
                        >
                          <MaterialIcons
                            name={getServerIcon(token.serverType) as any}
                            size={20}
                            color={getServerColor(token.serverType)}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-foreground font-semibold">{token.name}</Text>
                          <Text className="text-muted text-xs">
                            {SERVER_TYPES.find((s) => s.id === token.serverType)?.name}
                          </Text>
                        </View>
                      </View>
                      {token.isActive ? (
                        <View className="bg-success/20 rounded-full px-2 py-1">
                          <Text className="text-success text-xs font-semibold">Active</Text>
                        </View>
                      ) : (
                        <View className="bg-error/20 rounded-full px-2 py-1">
                          <Text className="text-error text-xs font-semibold">Revoked</Text>
                        </View>
                      )}
                    </View>

                    <View className="bg-background rounded p-2 mb-3">
                      <Text className="text-muted text-xs font-mono">{token.maskedToken}</Text>
                    </View>

                    <View className="gap-2">
                      <View className="flex-row justify-between">
                        <Text className="text-muted text-xs">
                          Created: {formatDate(token.createdAt)}
                        </Text>
                        {token.lastUsedAt && (
                          <Text className="text-muted text-xs">
                            Last used: {formatDate(token.lastUsedAt)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {token.isActive && (
                      <View className="flex-row gap-2 mt-3 pt-3 border-t border-border">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedToken(token);
                      setShowRotateModal(true);
                    }}
                    className="flex-1 bg-primary/10 rounded py-2 items-center"
                  >
                    <Text className="text-primary font-semibold text-sm">Rotate</Text>
                  </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRevokeToken(token)}
                          className="flex-1 bg-error/10 rounded py-2 items-center"
                        >
                          <Text className="text-error font-semibold text-sm">Revoke</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1">
            {/* Server Selection */}
            <Text className="text-foreground font-semibold text-lg mb-3">Select Server</Text>

            <View className="gap-2 mb-6">
              {SERVER_TYPES.map((server) => (
                <TouchableOpacity
                  key={server.id}
                  onPress={() => {
                    setSelectedServer(server);
                    setShowTokenInput(true);
                  }}
                  className={cn(
                    'border rounded-lg p-4 flex-row items-center justify-between',
                    selectedServer?.id === server.id
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface border-border'
                  )}
                >
                  <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: getServerColor(server.id) + '20' }}
                      >
                        <MaterialIcons
                          name={getServerIcon(server.id) as any}
                          size={20}
                          color={getServerColor(server.id)}
                        />
                      </View>
                    <View>
                      <Text className="text-foreground font-semibold">{server.name}</Text>
                      <Text className="text-muted text-xs">{server.authMethod}</Text>
                    </View>
                  </View>
                  {selectedServer?.id === server.id && (
                        <MaterialIcons name={"check-circle" as any} size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Token Input Form */}
            {showTokenInput && selectedServer && (
              <View className="bg-surface rounded-lg p-4 gap-3 mb-4">
                <Text className="text-foreground font-semibold">Register {selectedServer.name} Token</Text>

                <View>
                  <Text className="text-muted text-xs mb-1">Token Name</Text>
                  <TextInput
                    placeholder="e.g., My GitHub Token"
                    value={tokenName}
                    onChangeText={setTokenName}
                    className="bg-background border border-border rounded px-3 py-2 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View>
                  <Text className="text-muted text-xs mb-1">API Token</Text>
                  <TextInput
                    placeholder={`Enter your ${selectedServer.name} token`}
                    value={tokenInput}
                    onChangeText={setTokenInput}
                    secureTextEntry={!showTokenInput}
                    className="bg-background border border-border rounded px-3 py-2 text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View className="bg-yellow-100 border border-yellow-300 rounded p-3">
                  <Text className="text-yellow-800 text-xs">
                    ⚠️ Your token will be encrypted and stored securely. Never share your token with anyone.
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      setShowTokenInput(false);
                      setTokenInput('');
                      setTokenName('');
                      setSelectedServer(null);
                    }}
                    className="flex-1 bg-muted/10 rounded py-3 items-center"
                  >
                    <Text className="text-muted font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRegisterToken}
                    disabled={loading}
                    className="flex-1 bg-primary rounded py-3 items-center"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-background font-semibold">Register Token</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Rotate Token Modal */}
      <Modal visible={showRotateModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 gap-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-foreground font-bold text-lg">Rotate Token</Text>
              <TouchableOpacity onPress={() => setShowRotateModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text className="text-muted">
              Enter your new {selectedToken?.serverType} token. The old token will be revoked.
            </Text>

            <TextInput
              placeholder="Enter new token"
              value={newToken}
              onChangeText={setNewToken}
              secureTextEntry
              className="bg-surface border border-border rounded px-3 py-3 text-foreground"
              placeholderTextColor={colors.muted}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowRotateModal(false)}
                className="flex-1 bg-muted/10 rounded py-3 items-center"
              >
                <Text className="text-muted font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRotateToken}
                disabled={loading}
                className="flex-1 bg-primary rounded py-3 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background font-semibold">Rotate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
