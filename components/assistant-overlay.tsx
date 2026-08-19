import { useEffect } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { AIChatModal } from "@/components/ai-chat-modal";
import { useAIAssistant } from "@/hooks/use-ai-assistant";

function retryIdFromNotification(notification: Notifications.Notification): string | null {
  const value = notification.request.content.data?.retryRequestId;
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

/** Hosts the single assistant modal and safely routes local reset-alert taps into one consumed retry request. */
export function AssistantOverlay() {
  const { isOpen, closeAssistant, openAssistantWithRetry, retryRequestId, clearRetryRequest } = useAIAssistant();

  useEffect(() => {
    if (Platform.OS === "web") return;
    const routeResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const retryId = retryIdFromNotification(response.notification);
      if (!retryId) return;
      router.navigate("/");
      openAssistantWithRetry(retryId);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };
    Notifications.getLastNotificationResponseAsync().then(routeResponse).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(routeResponse);
    return () => subscription.remove();
  }, [openAssistantWithRetry]);

  return <AIChatModal visible={isOpen} onClose={closeAssistant} retryRequestId={retryRequestId} onRetryHandled={clearRetryRequest} />;
}
