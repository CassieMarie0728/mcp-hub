import { NotificationEngine, NotificationType } from './notification-engine';

/**
 * Notification Dispatcher
 * Routes notifications to appropriate handlers based on type
 */
export class NotificationDispatcher {
  constructor(private notificationEngine: NotificationEngine) {}

  /**
   * Dispatch collaboration update notification
   */
  dispatchCollaborationUpdate(
    userId: string,
    collaboratorName: string,
    action: string,
    macroName: string,
  ): void {
    this.notificationEngine.createNotification(
      userId,
      'collaboration_update',
      `${collaboratorName} ${action}`,
      `Collaboration update on "${macroName}"`,
      {
        collaboratorName,
        action,
        macroName,
        actionType: 'collaboration',
      },
      'normal',
    );
  }

  /**
   * Dispatch schedule trigger notification
   */
  dispatchScheduleTrigger(
    userId: string,
    macroName: string,
    status: 'started' | 'completed' | 'failed',
  ): void {
    const titles: Record<string, string> = {
      started: `${macroName} started`,
      completed: `${macroName} completed`,
      failed: `${macroName} failed`,
    };

    const messages: Record<string, string> = {
      started: `Your scheduled macro "${macroName}" has started executing`,
      completed: `Your scheduled macro "${macroName}" completed successfully`,
      failed: `Your scheduled macro "${macroName}" failed to execute`,
    };

    const priority = status === 'failed' ? 'high' : 'normal';

    this.notificationEngine.createNotification(
      userId,
      'schedule_trigger',
      titles[status],
      messages[status],
      {
        macroName,
        status,
        actionType: 'schedule',
      },
      priority,
    );
  }

  /**
   * Dispatch macro execution notification
   */
  dispatchMacroExecution(
    userId: string,
    macroName: string,
    status: 'success' | 'failure',
    duration: number,
    errorMessage?: string,
  ): void {
    const title =
      status === 'success' ? `${macroName} executed successfully` : `${macroName} execution failed`;

    const message =
      status === 'success'
        ? `Macro completed in ${(duration / 1000).toFixed(2)}s`
        : `Error: ${errorMessage || 'Unknown error'}`;

    const priority = status === 'failure' ? 'high' : 'normal';

    this.notificationEngine.createNotification(
      userId,
      'macro_execution',
      title,
      message,
      {
        macroName,
        status,
        duration,
        errorMessage,
        actionType: 'execution',
      },
      priority,
    );
  }

  /**
   * Dispatch fork notification
   */
  dispatchForkNotification(
    userId: string,
    forkerName: string,
    macroName: string,
    forkName: string,
  ): void {
    this.notificationEngine.createNotification(
      userId,
      'fork_notification',
      `${forkerName} forked your macro`,
      `"${macroName}" was forked as "${forkName}"`,
      {
        forkerName,
        originalMacroName: macroName,
        forkName,
        actionType: 'fork',
      },
      'normal',
    );
  }

  /**
   * Dispatch version update notification
   */
  dispatchVersionUpdate(
    userId: string,
    macroName: string,
    versionNumber: number,
    changeDescription: string,
  ): void {
    this.notificationEngine.createNotification(
      userId,
      'version_update',
      `${macroName} v${versionNumber} released`,
      changeDescription,
      {
        macroName,
        versionNumber,
        changeDescription,
        actionType: 'version',
      },
      'normal',
    );
  }

  /**
   * Dispatch anomaly alert
   */
  dispatchAnomalyAlert(
    userId: string,
    anomalyType: string,
    macroName: string,
    details: string,
  ): void {
    const titles: Record<string, string> = {
      high_failure_rate: `High failure rate detected`,
      high_duration: `Slow execution detected`,
      increasing_errors: `Increasing errors detected`,
    };

    this.notificationEngine.createNotification(
      userId,
      'anomaly_alert',
      titles[anomalyType] || 'Anomaly detected',
      `${macroName}: ${details}`,
      {
        macroName,
        anomalyType,
        details,
        actionType: 'anomaly',
      },
      'high',
    );
  }

  /**
   * Dispatch system alert
   */
  dispatchSystemAlert(
    userId: string,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
  ): void {
    const priorityMap: Record<string, 'low' | 'normal' | 'high'> = {
      info: 'low',
      warning: 'normal',
      critical: 'high',
    };

    this.notificationEngine.createNotification(
      userId,
      'system_alert',
      title,
      message,
      {
        severity,
        actionType: 'system',
      },
      priorityMap[severity],
    );
  }

  /**
   * Dispatch user mention notification
   */
  dispatchUserMention(
    userId: string,
    mentionerName: string,
    context: string,
    contextType: 'comment' | 'review',
  ): void {
    this.notificationEngine.createNotification(
      userId,
      'user_mention',
      `${mentionerName} mentioned you`,
      `You were mentioned in a ${contextType}: "${context.substring(0, 50)}..."`,
      {
        mentionerName,
        context,
        contextType,
        actionType: 'mention',
      },
      'normal',
    );
  }

  /**
   * Dispatch macro comment notification
   */
  dispatchMacroComment(
    userId: string,
    commenterName: string,
    macroName: string,
    comment: string,
  ): void {
    this.notificationEngine.createNotification(
      userId,
      'macro_comment',
      `${commenterName} commented on ${macroName}`,
      `"${comment.substring(0, 50)}..."`,
      {
        commenterName,
        macroName,
        comment,
        actionType: 'comment',
      },
      'normal',
    );
  }

  /**
   * Dispatch download complete notification
   */
  dispatchDownloadComplete(userId: string, macroName: string, fileName: string): void {
    this.notificationEngine.createNotification(
      userId,
      'download_complete',
      `${macroName} downloaded`,
      `File: ${fileName}`,
      {
        macroName,
        fileName,
        actionType: 'download',
      },
      'low',
    );
  }

  /**
   * Dispatch batch notifications
   */
  dispatchBatch(notifications: BatchNotification[]): void {
    for (const notif of notifications) {
      switch (notif.type) {
        case 'collaboration_update':
          this.dispatchCollaborationUpdate(
            notif.userId,
            notif.data.collaboratorName,
            notif.data.action,
            notif.data.macroName,
          );
          break;

        case 'schedule_trigger':
          this.dispatchScheduleTrigger(notif.userId, notif.data.macroName, notif.data.status);
          break;

        case 'macro_execution':
          this.dispatchMacroExecution(
            notif.userId,
            notif.data.macroName,
            notif.data.status,
            notif.data.duration,
            notif.data.errorMessage,
          );
          break;

        case 'fork_notification':
          this.dispatchForkNotification(
            notif.userId,
            notif.data.forkerName,
            notif.data.originalMacroName,
            notif.data.forkName,
          );
          break;

        case 'version_update':
          this.dispatchVersionUpdate(
            notif.userId,
            notif.data.macroName,
            notif.data.versionNumber,
            notif.data.changeDescription,
          );
          break;

        case 'anomaly_alert':
          this.dispatchAnomalyAlert(
            notif.userId,
            notif.data.anomalyType,
            notif.data.macroName,
            notif.data.details,
          );
          break;

        case 'system_alert':
          this.dispatchSystemAlert(
            notif.userId,
            notif.data.title,
            notif.data.message,
            notif.data.severity,
          );
          break;

        case 'user_mention':
          this.dispatchUserMention(
            notif.userId,
            notif.data.mentionerName,
            notif.data.context,
            notif.data.contextType,
          );
          break;

        case 'macro_comment':
          this.dispatchMacroComment(
            notif.userId,
            notif.data.commenterName,
            notif.data.macroName,
            notif.data.comment,
          );
          break;

        case 'download_complete':
          this.dispatchDownloadComplete(notif.userId, notif.data.macroName, notif.data.fileName);
          break;
      }
    }
  }

  /**
   * Dispatch priority notifications
   */
  async dispatchPriority(maxRetries: number = 3): Promise<number> {
    let delivered = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const count = await this.notificationEngine.deliverPendingNotifications();
      delivered += count;

      if (count === 0) break;

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }

    return delivered;
  }
}

/**
 * Batch notification
 */
export interface BatchNotification {
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
}
