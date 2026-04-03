import { NativeModules, NativeEventEmitter } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

const { MCPServerBridgeExtended } = NativeModules;

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  toolName: string;
  serverName: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
  message?: string;
  userId?: string;
  error?: string | null;
  result?: unknown;
}

export interface AuditLogStats {
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  lastExecutionTime: number;
}

export interface GovernanceSettings {
  allowlist: Array<{ packageName: string; appName: string; status: 'allowed' }>;
  blocklist: Array<{ packageName: string; appName: string; status: 'blocked' }>;
}

export interface ServiceStatus {
  isRunning: boolean;
  uptime: number;
  connectionsActive: number;
  toolsExposed: number;
  notificationEnabled: boolean;
}

export interface PerceptionData {
  elementCount: number;
  elements: Array<{
    type: string;
    label: string;
    description: string;
    isInteractive: boolean;
  }>;
  visualChips: string[];
  timestamp: number;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  actions: Array<{
    type: string;
    toolName: string;
    params: string;
  }>;
  createdAt: number;
}

export function useMCPBridgeExtended() {
  const [isAvailable, setIsAvailable] = useState(!!MCPServerBridgeExtended);

  // Audit Log Methods
  const getAuditLog = useCallback(
    async (filter: 'all' | 'success' | 'error' = 'all', limit: number = 100) => {
      if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
      return MCPServerBridgeExtended.getAuditLog(filter, limit) as Promise<AuditLogEntry[]>;
    },
    []
  );

  const getAuditLogStats = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.getAuditLogStats() as Promise<AuditLogStats>;
  }, []);

  // Governance Methods
  const getGovernanceSettings = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.getGovernanceSettings() as Promise<GovernanceSettings>;
  }, []);

  const updateAppStatus = useCallback(
    async (packageName: string, status: 'allowed' | 'blocked') => {
      if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
      return MCPServerBridgeExtended.updateAppStatus(packageName, status) as Promise<boolean>;
    },
    []
  );

  // Service Control Methods
  const getServiceStatus = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.getServiceStatus() as Promise<ServiceStatus>;
  }, []);

  const startMCPService = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.startMCPService() as Promise<boolean>;
  }, []);

  const stopMCPService = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.stopMCPService() as Promise<boolean>;
  }, []);

  const toggleServiceNotification = useCallback(async (enabled: boolean) => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.toggleServiceNotification(enabled) as Promise<boolean>;
  }, []);

  // Perception Methods
  const capturePerception = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.capturePerception() as Promise<PerceptionData>;
  }, []);

  // Macro Methods
  const getMacros = useCallback(async () => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.getMacros() as Promise<Macro[]>;
  }, []);

  const createMacro = useCallback(
    async (name: string, description?: string) => {
      if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
      return MCPServerBridgeExtended.createMacro(name, description) as Promise<Macro>;
    },
    []
  );

  const deleteMacro = useCallback(async (macroId: string) => {
    if (!MCPServerBridgeExtended) throw new Error('MCPServerBridgeExtended not available');
    return MCPServerBridgeExtended.deleteMacro(macroId) as Promise<boolean>;
  }, []);

  return {
    isAvailable,
    // Audit Log
    getAuditLog,
    getAuditLogStats,
    // Governance
    getGovernanceSettings,
    updateAppStatus,
    // Service Control
    getServiceStatus,
    startMCPService,
    stopMCPService,
    toggleServiceNotification,
    // Perception
    capturePerception,
    // Macros
    getMacros,
    createMacro,
    deleteMacro,
  };
}

/**
 * Hook for listening to native events
 */
export function useMCPBridgeEvents(
  eventName: string,
  callback: (data: any) => void
) {
  useEffect(() => {
    if (!MCPServerBridgeExtended) return;

    const eventEmitter = new NativeEventEmitter(MCPServerBridgeExtended);
    const subscription = eventEmitter.addListener(eventName, callback);

    return () => {
      subscription.remove();
    };
  }, [eventName, callback]);
}
