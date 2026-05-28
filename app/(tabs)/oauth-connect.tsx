/**
 * OAuth Connection Screen
 * Handles OAuth flows for GitHub, Slack, and Notion
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { cn } from '@/lib/utils';
import * as WebBrowser from 'expo-web-browser';

type ServerType = 'github' | 'slack' | 'notion';

interface OAuthServer {
  id: ServerType;
  name: string;
  icon: string;
  color: string;
  description: string;
  scopes: string[];
}

const OAUTH_SERVERS: OAuthServer[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'code',
    color: '#333333',
    description: 'Connect to GitHub for issue and PR automation',
    scopes: ['repo', 'user', 'gist'],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'chat',
    color: '#36C5F0',
    description: 'Connect to Slack for message and channel automation',
    scopes: ['chat:write', 'channels:read', 'users:read'],
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'description',
    color: '#000000',
    description: 'Connect to Notion for database and page automation',
    scopes: ['read', 'write'],
  },
];

export default function OAuthConnectScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedServers, setConnectedServers] = useState<ServerType[]>([]);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  // Simulate getting authorization URL
  const handleStartOAuth = useCallback(async (serverType: ServerType) => {
    try {
      setIsConnecting(true);
      setSelectedServer(serverType);

      // In production, this would call the backend API
      // const response = await trpc.oauth.getAuthorizationUrl.query({
      //   serverType,
      //   serverId: `${serverType}-1`,
      // });

      // For now, simulate the OAuth URL
      const mockAuthUrl = `https://${serverType}.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/oauth/${serverType}/callback`;
      setAuthUrl(mockAuthUrl);

      // Open OAuth URL in browser
      const result = await WebBrowser.openAuthSessionAsync(
        mockAuthUrl,
        `http://localhost:3000/oauth/${serverType}/callback`,
      );

      if (result.type === 'success') {
        // OAuth flow completed successfully
        setConnectedServers((prev) => [...prev, serverType]);
        Alert.alert(
          'Success',
          `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} connected successfully!`,
        );
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'OAuth connection was cancelled');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
      setSelectedServer(null);
      setAuthUrl(null);
    }
  }, []);

  const handleDisconnect = useCallback((serverType: ServerType) => {
    Alert.alert('Disconnect', `Are you sure you want to disconnect ${serverType}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          setConnectedServers((prev) => prev.filter((s) => s !== serverType));
          Alert.alert('Disconnected', `${serverType} has been disconnected`);
        },
      },
    ]);
  }, []);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        {/* Header */}
        <View className="bg-surface border-b border-border p-6">
          <Text className="text-2xl font-bold text-foreground mb-2">Connect Services</Text>
          <Text className="text-sm text-muted">
            Link your GitHub, Slack, and Notion accounts to automate workflows
          </Text>
        </View>

        {/* OAuth Servers List */}
        <View className="p-4 gap-4">
          {OAUTH_SERVERS.map((server) => {
            const isConnected = connectedServers.includes(server.id);
            const isConnecting = selectedServer === server.id;

            return (
              <View
                key={server.id}
                className="bg-surface rounded-2xl border border-border overflow-hidden"
              >
                {/* Server Card */}
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: server.color + '20' }}
                      >
                        <MaterialIcons name={server.icon as any} size={24} color={server.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">{server.name}</Text>
                        <Text className="text-xs text-muted">
                          {isConnected ? 'Connected' : 'Not connected'}
                        </Text>
                      </View>
                    </View>

                    {/* Status Indicator */}
                    <View className="flex-row items-center gap-2">
                      {isConnected && (
                        <MaterialIcons name="check-circle" size={20} color={colors.success} />
                      )}
                      {isConnecting && <ActivityIndicator size="small" color={colors.primary} />}
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-sm text-muted mb-4">{server.description}</Text>

                  {/* Scopes */}
                  <View className="mb-4">
                    <Text className="text-xs font-semibold text-muted mb-2">Permissions</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {server.scopes.map((scope) => (
                        <View key={scope} className="bg-background rounded-full px-3 py-1">
                          <Text className="text-xs text-foreground">{scope}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Button */}
                  <Pressable
                    onPress={() =>
                      isConnected ? handleDisconnect(server.id) : handleStartOAuth(server.id)
                    }
                    disabled={isConnecting}
                    style={({ pressed }) => [
                      pressed && { opacity: 0.8 },
                      isConnecting && { opacity: 0.6 },
                    ]}
                    className={cn(
                      'rounded-lg p-3 items-center',
                      isConnected ? 'bg-background border border-error' : 'bg-primary',
                    )}
                  >
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons
                        name={isConnecting ? 'hourglass-empty' : isConnected ? 'logout' : 'login'}
                        size={18}
                        color={isConnected ? colors.error : colors.background}
                      />
                      <Text
                        className={cn(
                          'font-semibold',
                          isConnected ? 'text-error' : 'text-background',
                        )}
                      >
                        {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* Connected Info */}
                {isConnected && (
                  <View className="bg-background border-t border-border p-4">
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialIcons name="info" size={16} color={colors.muted} />
                      <Text className="text-xs text-muted">Last used: 2 hours ago</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name="schedule" size={16} color={colors.muted} />
                      <Text className="text-xs text-muted">Expires in 89 days</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Connected Summary */}
        {connectedServers.length > 0 && (
          <View className="mx-4 mb-4 bg-success/10 rounded-lg p-4 border border-success/20">
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="check-circle" size={20} color={colors.success} />
              <Text className="text-sm font-semibold text-success">
                {connectedServers.length} service
                {connectedServers.length !== 1 ? 's' : ''} connected
              </Text>
            </View>
            <Text className="text-xs text-muted">
              You can now use these services in your automation workflows
            </Text>
          </View>
        )}

        {/* Security Notice */}
        <View className="mx-4 mb-6 bg-warning/10 rounded-lg p-4 border border-warning/20">
          <View className="flex-row items-start gap-2">
            <MaterialIcons
              name="security"
              size={20}
              color={colors.warning}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-warning mb-1">Security</Text>
              <Text className="text-xs text-muted">
                Your tokens are encrypted and stored securely. Never share your authentication links
                with anyone.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
