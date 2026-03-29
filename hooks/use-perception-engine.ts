import { useCallback, useState, useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { PerceptionBridge } = NativeModules;

interface PerceptionSnapshot {
  elements: Array<{
    id: string;
    type: string;
    text?: string;
    desc?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    click?: boolean;
    longClick?: boolean;
    check?: boolean;
    edit?: boolean;
    disabled?: boolean;
  }>;
  elementCount: number;
  visualChips?: Array<{
    id: string;
    type: string;
    chip: string;
    size: number;
  }>;
  chipCount?: number;
  timestamp: number;
  generationTime: number;
  version: string;
}

interface EngineInfo {
  name: string;
  version: string;
  features: string[];
  maxElements: number;
  maxChipSize: number;
  timestamp: number;
}

/**
 * Hook for using Hybrid Perception Engine
 */
export function usePerceptionEngine() {
  const [snapshot, setSnapshot] = useState<PerceptionSnapshot | null>(null);
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate full perception snapshot
   */
  const generateSnapshot = useCallback(async (includeVisualChips: boolean = false) => {
    if (Platform.OS !== 'android') {
      console.warn('Perception engine only available on Android');
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PerceptionBridge.generatePerceptionSnapshot(includeVisualChips);
      const parsedSnapshot = JSON.parse(result) as PerceptionSnapshot;
      setSnapshot(parsedSnapshot);
      return parsedSnapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error generating perception snapshot:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate condensed perception snapshot (minimal tokens)
   */
  const generateCondensedSnapshot = useCallback(async (includeVisualChips: boolean = false) => {
    if (Platform.OS !== 'android') {
      console.warn('Perception engine only available on Android');
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PerceptionBridge.generateCondensedSnapshot(includeVisualChips);
      const parsedSnapshot = JSON.parse(result);
      return parsedSnapshot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error generating condensed snapshot:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get element by ID
   */
  const getElementById = useCallback(async (elementId: string) => {
    if (Platform.OS !== 'android') {
      console.warn('Perception engine only available on Android');
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await PerceptionBridge.getElementById(elementId);
      return JSON.parse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting element:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear perception cache
   */
  const clearCache = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    try {
      const result = await PerceptionBridge.clearCache();
      setSnapshot(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error clearing cache:', err);
      return null;
    }
  }, []);

  /**
   * Get engine statistics
   */
  const getStatistics = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    try {
      const result = await PerceptionBridge.getStatistics();
      return JSON.parse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting statistics:', err);
      return null;
    }
  }, []);

  /**
   * Get engine info
   */
  const getEngineInfo = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return null;
    }

    if (!PerceptionBridge) {
      setError('PerceptionBridge module not available');
      return null;
    }

    try {
      const result = await PerceptionBridge.getEngineInfo();
      const info = typeof result === 'string' ? JSON.parse(result) : result;
      setEngineInfo(info as EngineInfo);
      return info;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Error getting engine info:', err);
      return null;
    }
  }, []);

  /**
   * Get engine info on mount
   */
  useEffect(() => {
    getEngineInfo();
  }, [getEngineInfo]);

  return {
    snapshot,
    engineInfo,
    isLoading,
    error,
    generateSnapshot,
    generateCondensedSnapshot,
    getElementById,
    clearCache,
    getStatistics,
    getEngineInfo,
  };
}
