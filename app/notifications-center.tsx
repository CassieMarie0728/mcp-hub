import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';

/**
 * Notifications Center Screen
 * View and manage all notifications
 */
export default function NotificationsCenterScreen() {
  const router = useRouter();
  const colors = useColors();

  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 'notif1',
      type: 'macro_execution',
      title: 'Macro executed successfully',
      message: 'Send WhatsApp Message completed in 2.34s',
      timestamp: new Date(Date.now() - 300000),
      read: false,
      priority: 'normal',
    },
    {
      id: 'notif2',
      type: 'collaboration_update',
      title: 'John edited Send WhatsApp Message',
      message: 'Added retry logic for failed attempts',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      priority: 'normal',
    },
    {
      id: 'notif3',
      type: 'anomaly_alert',
      title: 'High failure rate detected',
      message: 'Send WhatsApp Message: 45% failure rate in last hour',
      timestamp: new Date(Date.now() - 7200000),
      read: true,
      priority: 'high',
    },
    {
      id: 'notif4',
      type: 'schedule_trigger',
      title: 'Daily Report completed',
      message: 'Your scheduled macro executed successfully',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      priority: 'normal',
    },
    {
      id: 'notif5',
      type: 'fork_notification',
      title: 'Sarah forked your macro',
      message: '"Send WhatsApp Message" was forked as "Send WhatsApp + Log"',
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      priority: 'normal',
    },
  ]);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  /**
   * Get notification icon
   */
  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      macro_execution: '▶️',
      collaboration_update: '👥',
      anomaly_alert: '⚠️',
      schedule_trigger: '⏰',
      fork_notification: '🔀',
      version_update: '📦',
      system_alert: '🔔',
      user_mention: '@',
      macro_comment: '💬',
      download_complete: '⬇️',
    };
    return icons[type] || '📢';
  };

  /**
   * Get notification color
   */
  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error/10 border-error';
      case 'normal':
        return 'bg-surface border-border';
      case 'low':
        return 'bg-background border-border';
      default:
        return 'bg-surface border-border';
    }
  };

  /**
   * Format time
   */
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  /**
   * Mark as read
   */
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  /**
   * Delete notification
   */
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  /**
   * Mark all as read
   */
  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  /**
   * Filter notifications
   */
  const filteredNotifications = notifications.filter((n) => {
    if (filterType && n.type !== filterType) return false;
    if (showUnreadOnly && n.read) return false;
    return true;
  });

  /**
   * Render notification card
   */
  const renderNotificationCard = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => markAsRead(item.id)}
      className={cn(
        'rounded-xl p-4 mb-3 border flex-row gap-3 active:opacity-70',
        getNotificationColor(item.priority),
        !item.read && 'bg-primary/5'
      )}
    >
      <Text className="text-2xl">{getNotificationIcon(item.type)}</Text>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between">
          <Text className={cn('font-semibold', !item.read ? 'text-foreground' : 'text-muted')}>
            {item.title}
          </Text>
          {!item.read && <View className="w-2 h-2 rounded-full bg-primary" />}
        </View>

        <Text className="text-sm text-muted">{item.message}</Text>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs text-muted">{formatTime(item.timestamp)}</Text>

          <Pressable
            onPress={() => deleteNotification(item.id)}
            className="bg-error/20 rounded px-2 py-1 active:opacity-70"
          >
            <Text className="text-xs font-semibold text-error">Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-foreground">Notifications</Text>
              {unreadCount > 0 && (
                <View className="bg-error rounded-full px-3 py-1">
                  <Text className="text-xs font-bold text-background">{unreadCount}</Text>
                </View>
              )}
            </View>
            <Text className="text-base text-muted">Stay updated on macros and collaborations</Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            {unreadCount > 0 && (
              <Pressable
                onPress={markAllAsRead}
                className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-background">Mark All as Read</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowUnreadOnly(!showUnreadOnly)}
              className={cn(
                'flex-1 rounded-lg p-3 active:opacity-80 border',
                showUnreadOnly ? 'bg-primary border-primary' : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold',
                  showUnreadOnly ? 'text-background' : 'text-foreground'
                )}
              >
                Unread Only
              </Text>
            </Pressable>
          </View>

          {/* Filter Buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <Pressable
              onPress={() => setFilterType(null)}
              className={cn(
                'px-4 py-2 rounded-full border',
                filterType === null ? 'bg-primary border-primary' : 'bg-surface border-border'
              )}
            >
              <Text
                className={cn(
                  'font-semibold text-sm',
                  filterType === null ? 'text-background' : 'text-foreground'
                )}
              >
                All
              </Text>
            </Pressable>

            {['macro_execution', 'collaboration_update', 'anomaly_alert', 'schedule_trigger'].map((type) => (
              <Pressable
                key={type}
                onPress={() => setFilterType(filterType === type ? null : type)}
                className={cn(
                  'px-4 py-2 rounded-full border',
                  filterType === type ? 'bg-primary border-primary' : 'bg-surface border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-sm',
                    filterType === type ? 'text-background' : 'text-foreground'
                  )}
                >
                  {type.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Notifications List */}
          {filteredNotifications.length > 0 ? (
            <FlatList
              scrollEnabled={false}
              data={filteredNotifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationCard}
            />
          ) : (
            <View className="bg-surface rounded-xl p-8 border border-border items-center gap-2">
              <Text className="text-2xl">📭</Text>
              <Text className="text-lg font-semibold text-foreground">No notifications</Text>
              <Text className="text-sm text-muted text-center">You're all caught up!</Text>
            </View>
          )}

          {/* Statistics */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <Text className="text-sm font-semibold text-muted">STATISTICS</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Total Notifications</Text>
                <Text className="text-lg font-bold text-primary">{notifications.length}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Unread</Text>
                <Text className="text-lg font-bold text-error">{unreadCount}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Read</Text>
                <Text className="text-lg font-bold text-success">{notifications.filter((n) => n.read).length}</Text>
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
