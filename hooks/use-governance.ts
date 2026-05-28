import { useCallback, useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { GovernanceBridge } = NativeModules;

interface PendingConsent {
  id: string;
  operation: string;
  description: string;
  app: string;
  timestamp: number;
}

interface GovernanceStatus {
  sandbox: {
    allowlistCount: number;
    blacklistCount: number;
  };
  consent: {
    pendingRequests: number;
  };
  audit: {
    logSize: number;
  };
  timestamp: number;
}

/**
 * Hook for using Governance layer
 */
export function useGovernance() {
  const [status, setStatus] = useState<GovernanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if app is allowed
   */
  const isAppAllowed = useCallback(async (packageName: string): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      console.warn('Governance layer only available on Android');
      return true;
    }

    if (!GovernanceBridge) {
      setError('GovernanceBridge module not available');
      return true;
    }

    try {
      const allowed = await GovernanceBridge.isAppAllowed(packageName);
      return allowed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error checking app permission:', err);
      return false;
    }
  }, []);

  /**
   * Allow app
   */
  const allowApp = useCallback(async (packageName: string): Promise<boolean> => {
    if (Platform.OS !== 'android' || !GovernanceBridge) {
      return false;
    }

    try {
      const success = await GovernanceBridge.allowApp(packageName);
      await getGovernanceStatus();
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error allowing app:', err);
      return false;
    }
  }, []);

  /**
   * Block app
   */
  const blockApp = useCallback(async (packageName: string): Promise<boolean> => {
    if (Platform.OS !== 'android' || !GovernanceBridge) {
      return false;
    }

    try {
      const success = await GovernanceBridge.blockApp(packageName);
      await getGovernanceStatus();
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error blocking app:', err);
      return false;
    }
  }, []);

  /**
   * Request consent
   */
  const requestConsent = useCallback(
    async (operation: string, description: string, app: string): Promise<string> => {
      if (Platform.OS !== 'android' || !GovernanceBridge) {
        return '';
      }

      try {
        const requestId = await GovernanceBridge.requestConsent(operation, description, app);
        return requestId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error requesting consent:', err);
        return '';
      }
    },
    []
  );

  /**
   * Approve consent
   */
  const approveConsent = useCallback(async (requestId: string): Promise<boolean> => {
    if (Platform.OS !== 'android' || !GovernanceBridge) {
      return false;
    }

    try {
      const approved = await GovernanceBridge.approveConsent(requestId);
      await getGovernanceStatus();
      return approved;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error approving consent:', err);
      return false;
    }
  }, []);

  /**
   * Deny consent
   */
  const denyConsent = useCallback(
    async (requestId: string, reason?: string): Promise<boolean> => {
      if (Platform.OS !== 'android' || !GovernanceBridge) {
        return false;
      }

      try {
        const denied = await GovernanceBridge.denyConsent(requestId, reason);
        await getGovernanceStatus();
        return denied;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error denying consent:', err);
        return false;
      }
    },
    []
  );

  /**
   * Get pending consents
   */
  const getPendingConsents = useCallback(async (): Promise<PendingConsent[]> => {
    if (Platform.OS !== 'android' || !GovernanceBridge) {
      return [];
    }

    try {
      const consents = await GovernanceBridge.getPendingConsents();
      return consents || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting pending consents:', err);
      return [];
    }
  }, []);

  /**
   * Log tool execution
   */
  const logToolExecution = useCallback(
    async (
      action: string,
      agent: string,
      tool: string,
      status: string,
      duration: number
    ): Promise<string> => {
      if (Platform.OS !== 'android' || !GovernanceBridge) {
        return '';
      }

      try {
        const entryId = await GovernanceBridge.logToolExecution(
          action,
          agent,
          tool,
          status,
          duration
        );
        return entryId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error logging tool execution:', err);
        return '';
      }
    },
    []
  );

  /**
   * Get governance status
   */
  const getGovernanceStatus = useCallback(async () => {
    if (Platform.OS !== 'android' || !GovernanceBridge) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const governanceStatus = await GovernanceBridge.getGovernanceStatus();
      setStatus(governanceStatus);
      return governanceStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting governance status:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get governance status on mount
   */
  useEffect(() => {
    getGovernanceStatus();
  }, [getGovernanceStatus]);

  return {
    status,
    isLoading,
    error,
    isAppAllowed,
    allowApp,
    blockApp,
    requestConsent,
    approveConsent,
    denyConsent,
    getPendingConsents,
    logToolExecution,
    getGovernanceStatus,
  };
}
