import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Macro Version History Screen
 * View, compare, and rollback macro versions
 */
export default function MacroVersionHistoryScreen() {
  const router = useRouter();
  const colors = useColors();

  const [versions, setVersions] = useState<any[]>([
    {
      id: 'v1',
      versionNumber: 1,
      author: 'You',
      timestamp: new Date(Date.now() - 86400000 * 7),
      description: 'Initial version',
      changes: 2,
      isReleased: true,
    },
    {
      id: 'v2',
      versionNumber: 2,
      author: 'You',
      timestamp: new Date(Date.now() - 86400000 * 5),
      description: 'Fixed bug in action parsing',
      changes: 3,
      isReleased: true,
    },
    {
      id: 'v3',
      versionNumber: 3,
      author: 'You',
      timestamp: new Date(Date.now() - 86400000 * 2),
      description: 'Added retry logic',
      changes: 5,
      isReleased: true,
    },
    {
      id: 'v4',
      versionNumber: 4,
      author: 'You',
      timestamp: new Date(Date.now() - 3600000),
      description: 'Performance improvements',
      changes: 4,
      isReleased: false,
    },
  ]);

  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<any | null>(null);

  /**
   * Handle rollback
   */
  const handleRollback = (version: any) => {
    Alert.alert(
      'Rollback to Version?',
      `Are you sure you want to rollback to v${version.versionNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rollback',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', `Rolled back to v${version.versionNumber}`);
          },
        },
      ]
    );
  };

  /**
   * Handle compare
   */
  const handleCompare = (version: any) => {
    if (compareMode && compareVersion?.id === version.id) {
      setCompareMode(false);
      setCompareVersion(null);
    } else {
      setCompareVersion(version);
      setCompareMode(true);
    }
  };

  /**
   * Format date
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Render version card
   */
  const renderVersionCard = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => setSelectedVersion(item)}
      className={cn(
        'bg-surface rounded-xl p-4 mb-3 border active:opacity-70',
        selectedVersion?.id === item.id ? 'border-primary' : 'border-border'
      )}
    >
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">v{item.versionNumber}</Text>
            <Text className="text-xs text-muted mt-1">{item.description}</Text>
          </View>
          {item.isReleased && (
            <View className="bg-success/20 rounded-full px-2 py-1">
              <Text className="text-xs font-semibold text-success">Released</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between text-xs text-muted">
          <Text className="text-xs text-muted">By {item.author}</Text>
          <Text className="text-xs text-muted">{formatDate(item.timestamp)}</Text>
        </View>

        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => handleCompare(item)}
            className={cn(
              'flex-1 rounded-lg p-2 active:opacity-70',
              compareVersion?.id === item.id ? 'bg-primary' : 'bg-background border border-border'
            )}
          >
            <Text
              className={cn(
                'text-center text-xs font-semibold',
                compareVersion?.id === item.id ? 'text-background' : 'text-foreground'
              )}
            >
              Compare
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleRollback(item)}
            className="flex-1 bg-error/20 rounded-lg p-2 active:opacity-70"
          >
            <Text className="text-center text-xs font-semibold text-error">Rollback</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  /**
   * Render diff view
   */
  const renderDiffView = () => {
    if (!compareMode || !compareVersion) return null;

    return (
      <View className="bg-surface rounded-xl p-4 mb-4 border border-border gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">Comparing Versions</Text>
          <Pressable
            onPress={() => {
              setCompareMode(false);
              setCompareVersion(null);
            }}
            className="bg-error/20 rounded-lg px-3 py-1"
          >
            <Text className="text-xs font-semibold text-error">Close</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <View className="flex-row gap-2">
            <View className="flex-1 bg-error/10 rounded-lg p-2 border border-error">
              <Text className="text-xs font-semibold text-error">From v{selectedVersion?.versionNumber}</Text>
              <Text className="text-xs text-muted mt-1">{selectedVersion?.description}</Text>
            </View>
            <View className="flex-1 bg-success/10 rounded-lg p-2 border border-success">
              <Text className="text-xs font-semibold text-success">To v{compareVersion.versionNumber}</Text>
              <Text className="text-xs text-muted mt-1">{compareVersion.description}</Text>
            </View>
          </View>

          <View className="bg-background rounded-lg p-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">Changes</Text>
              <Text className="text-sm font-bold text-foreground">{compareVersion.changes}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted">Lines Changed</Text>
              <Text className="text-sm font-bold text-foreground">~{compareVersion.changes * 3}</Text>
            </View>
          </View>

          <Pressable className="bg-primary rounded-lg p-3 active:opacity-80">
            <Text className="text-center font-semibold text-background">View Full Diff</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Version History</Text>
            <Text className="text-base text-muted">View, compare, and rollback macro versions</Text>
          </View>

          {/* Diff View */}
          {renderDiffView()}

          {/* Versions List */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-muted">VERSIONS ({versions.length})</Text>
              <View className="bg-primary/20 rounded-full px-2 py-1">
                <Text className="text-xs font-bold text-primary">v{versions[versions.length - 1].versionNumber}</Text>
              </View>
            </View>

            <FlatList
              scrollEnabled={false}
              data={versions}
              keyExtractor={(item) => item.id}
              renderItem={renderVersionCard}
            />
          </View>

          {/* Version Statistics */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-muted">STATISTICS</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Total Versions</Text>
                <Text className="text-lg font-bold text-primary">{versions.length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Released</Text>
                <Text className="text-lg font-bold text-success">{versions.filter((v) => v.isReleased).length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Total Changes</Text>
                <Text className="text-lg font-bold text-warning">{versions.reduce((sum, v) => sum + v.changes, 0)}</Text>
              </View>
            </View>
          </View>

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="bg-surface border border-border rounded-lg p-4 active:opacity-80"
          >
            <Text className="text-center font-semibold text-foreground">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
