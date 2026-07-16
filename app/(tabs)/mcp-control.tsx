import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useMCPBridge } from '@/hooks/use-mcp-bridge';

/**
 * MCP Server Control Screen - Demonstrates IPC Bridge usage
 */
export default function MCPControlScreen() {
  const {
    serverStatus,
    isLoading,
    error,
    startServer,
    stopServer,
    getServerStatus,
    executeFilesTool,
  } = useMCPBridge();

  const [fileListResult, setFileListResult] = useState<any>(null);

  useEffect(() => {
    // Check server status on mount
    getServerStatus();
  }, [getServerStatus]);

  const handleStartServer = async () => {
    await startServer({
      httpPort: 8080,
      enableSSE: true,
      enableWebSocket: true,
      enableStdio: false,
    });
  };

  const handleTestFilesTool = async () => {
    const result = await executeFilesTool('listFiles', {
      path: '/sdcard/Download',
    });
    setFileListResult(result);
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          {/* Header */}
          <View className="items-center gap-2 mb-4">
            <Text className="text-3xl font-bold text-foreground">MCP Server Control</Text>
            <Text className="text-sm text-muted">Manage your MCP server instance</Text>
          </View>

          {/* Status Card */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">Server Status</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-muted">Status:</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    serverStatus.isRunning ? 'bg-success' : 'bg-error'
                  }`}
                >
                  <Text className="text-white text-xs font-semibold">
                    {serverStatus.isRunning ? 'Running' : 'Stopped'}
                  </Text>
                </View>
              </View>

              {serverStatus.isRunning && serverStatus.serverInfo && (
                <>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">Uptime:</Text>
                    <Text className="text-foreground">
                      {Math.floor(serverStatus.serverInfo.uptime / 1000)}s
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">Transports:</Text>
                    <Text className="text-foreground">
                      {serverStatus.serverInfo.transports?.join(', ') || 'None'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Control Buttons */}
          <View className="gap-2">
            <TouchableOpacity
              className={`py-3 px-4 rounded-lg items-center ${
                isLoading
                  ? 'bg-primary opacity-50'
                  : serverStatus.isRunning
                    ? 'bg-error'
                    : 'bg-success'
              }`}
              onPress={serverStatus.isRunning ? stopServer : handleStartServer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">
                  {serverStatus.isRunning ? 'Stop Server' : 'Start Server'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 px-4 rounded-lg items-center bg-primary"
              onPress={getServerStatus}
              disabled={isLoading}
            >
              <Text className="text-white font-semibold">Refresh Status</Text>
            </TouchableOpacity>
          </View>

          {/* Test Tool Execution */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">Test Tool Execution</Text>
            <TouchableOpacity
              className="py-3 px-4 rounded-lg items-center bg-primary mb-2"
              onPress={handleTestFilesTool}
              disabled={isLoading}
            >
              <Text className="text-white font-semibold">List Files (/sdcard/Download)</Text>
            </TouchableOpacity>

            {fileListResult && (
              <View className="bg-background rounded p-2 mt-2">
                <Text className="text-xs text-muted font-mono">
                  {JSON.stringify(fileListResult, null, 2)}
                </Text>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View className="bg-error bg-opacity-10 rounded-lg p-3 border border-error">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          {/* Info */}
          <View className="bg-primary bg-opacity-10 rounded-lg p-3 border border-primary">
            <Text className="text-primary text-xs">
              This screen demonstrates the IPC bridge between React Native and the Kotlin MCP Server
              backend. Use these controls to start/stop the server and test tool execution.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
