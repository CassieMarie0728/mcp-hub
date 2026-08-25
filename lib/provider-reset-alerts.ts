import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type ProviderId = "openrouter" | "gemini" | "groq" | "mistral";
const storageKey = (provider: ProviderId) => `mcp-hub.provider-reset-alert.${provider}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("provider-limits", {
      name: "Provider limit alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelProviderResetAlert(provider: ProviderId) {
  if (Platform.OS === "web") return;
  const scheduledId = await AsyncStorage.getItem(storageKey(provider));
  if (scheduledId) await Notifications.cancelScheduledNotificationAsync(scheduledId);
  await AsyncStorage.removeItem(storageKey(provider));
}

export async function scheduleProviderResetAlert(provider: ProviderId, resetAt: Date, retryRequestId?: string): Promise<{ scheduled: boolean; message: string }> {
  if (Platform.OS === "web") return { scheduled: false, message: "Reset alerts need the mobile app; browsers do not get a pretend notification button." };
  if (resetAt.getTime() <= Date.now()) return { scheduled: false, message: "That reset time already passed, so no stale notification was scheduled." };
  if (!await ensurePermission()) return { scheduled: false, message: "Notification permission is off, so the reset alert stayed respectfully quiet." };
  await cancelProviderResetAlert(provider);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${provider[0].toUpperCase()}${provider.slice(1)} limit reset`,
      body: retryRequestId ? "Tap once to retry your saved assistant request. No tool action will run without your approval." : "The quota goblin says your provider may be ready again. Refresh usage before launching another prompt parade.",
      data: { provider, url: "/", retryRequestId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: resetAt, channelId: "provider-limits" },
  });
  await AsyncStorage.setItem(storageKey(provider), identifier);
  return { scheduled: true, message: "Reset alert scheduled on this device. It will not send your key anywhere." };
}
