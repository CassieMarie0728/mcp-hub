import { useCallback, useState, useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';

const { PerceptionBridge } = NativeModules;

export interface AccessibilityElement {
  id: string;
  type: string;
  text: string;
  description: string;
  className: string;
  interactive: boolean;
  clickable: boolean;
  editable: boolean;
  enabled: boolean;
  focused: boolean;
  depth: number;
  resourceId: string;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

export interface VisualChip {
  elementId: string;
  elementText: string;
  elementType: string;
  base64Data: string;
  timestamp: number;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
}

export interface ScreenComplexity {
  totalElements: number;
  interactiveElements: number;
  textElements: number;
  maxDepth: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface HybridPerceptionResult {
  success: boolean;
  timestamp: number;
  errorMessage?: string;
  elements: AccessibilityElement[];
  visualChips: VisualChip[];
  complexity: ScreenComplexity;
}

// Legacy interfaces for backward compatibility
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

  /**
   * Capture hybrid perception (new API)
   */
  const captureHybridPerception = useCallback(
    async (useCache: boolean = true, onlyInteractiveChips: boolean = true) => {
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
        const result = await PerceptionBridge.captureHybridPerception(
          useCache,
          onlyInteractiveChips
        );
        return result as HybridPerceptionResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Error capturing hybrid perception:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get interactive elements
   */
  const getInteractiveElements = useCallback(async () => {
    if (Platform.OS !== 'android' || !PerceptionBridge) {
      return [];
    }

    try {
      const elements = await PerceptionBridge.getInteractiveElements();
      return elements || [];
    } catch (err) {
      console.error('Error getting interactive elements:', err);
      return [];
    }
  }, []);

  /**
   * Get screen text
   */
  const getScreenText = useCallback(async () => {
    if (Platform.OS !== 'android' || !PerceptionBridge) {
      return '';
    }

    try {
      const text = await PerceptionBridge.getScreenText();
      return text || '';
    } catch (err) {
      console.error('Error getting screen text:', err);
      return '';
    }
  }, []);

  /**
   * Find element by text
   */
  const findElementByText = useCallback(async (text: string) => {
    if (Platform.OS !== 'android' || !PerceptionBridge) {
      return null;
    }

    try {
      const element = await PerceptionBridge.findElementByText(text);
      return element || null;
    } catch (err) {
      console.error('Error finding element:', err);
      return null;
    }
  }, []);

  /**
   * Find element by coordinates
   */
  const findElementByCoordinates = useCallback(async (x: number, y: number) => {
    if (Platform.OS !== 'android' || !PerceptionBridge) {
      return null;
    }

    try {
      const element = await PerceptionBridge.findElementByCoordinates(x, y);
      return element || null;
    } catch (err) {
      console.error('Error finding element:', err);
      return null;
    }
  }, []);

  /**
   * Get perception as JSON
   */
  const getPerceptionAsJSON = useCallback(
    async (format: 'accessibility' | 'condensed' | 'semantic' | 'interactive' | 'hybrid' = 'hybrid') => {
      if (Platform.OS !== 'android' || !PerceptionBridge) {
        return null;
      }

      try {
        const json = await PerceptionBridge.getPerceptionAsJSON(format.toUpperCase());
        return JSON.parse(json);
      } catch (err) {
        console.error('Error getting perception JSON:', err);
        return null;
      }
    },
    []
  );

  /**
   * Get perception summary
   */
  const getPerceptionSummary = useCallback(async () => {
    if (Platform.OS !== 'android' || !PerceptionBridge) {
      return '';
    }

    try {
      const summary = await PerceptionBridge.getPerceptionSummary();
      return summary || '';
    } catch (err) {
      console.error('Error getting perception summary:', err);
      return '';
    }
  }, []);

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
    // New API
    captureHybridPerception,
    getInteractiveElements,
    getScreenText,
    findElementByText,
    findElementByCoordinates,
    getPerceptionAsJSON,
    getPerceptionSummary,
  };
}

/**
 * Hook for monitoring perception changes
 */
export function usePerceptionMonitor(interval: number = 1000) {
  const { captureHybridPerception } = usePerceptionEngine();
  const [perceptions, setPerceptions] = useState<HybridPerceptionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    monitorRef.current = setInterval(async () => {
      const result = await captureHybridPerception();
      if (result) {
        setPerceptions((prev) => [...prev.slice(-9), result]);
      }
    }, interval);
  }, [isMonitoring, captureHybridPerception, interval]);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
    setIsMonitoring(false);
  }, []);

  const clearPerceptions = useCallback(() => {
    setPerceptions([]);
  }, []);

  useEffect(() => {
    return () => {
      if (monitorRef.current) {
        clearInterval(monitorRef.current);
      }
    };
  }, []);

  return {
    perceptions,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearPerceptions,
  };
}

/**
 * Hook for perception comparison
 */
export function usePerceptionComparison() {
  const [previous, setPrevious] = useState<HybridPerceptionResult | null>(null);
  const [current, setCurrent] = useState<HybridPerceptionResult | null>(null);
  const [differences, setDifferences] = useState<{
    added: AccessibilityElement[];
    removed: AccessibilityElement[];
    changed: AccessibilityElement[];
  } | null>(null);

  const updatePerception = useCallback((perception: HybridPerceptionResult) => {
    setPrevious(current);
    setCurrent(perception);

    if (current) {
      const currentInteractive = perception.elements.filter((e) => e.interactive);
      const previousInteractive = current.elements.filter((e) => e.interactive);

      const added = currentInteractive.filter(
        (curr) =>
          !previousInteractive.some((p) => p.text === curr.text && p.type === curr.type)
      );

      const removed = previousInteractive.filter(
        (prev) =>
          !currentInteractive.some((c) => c.text === prev.text && c.type === prev.type)
      );

      const changed = currentInteractive.filter(
        (curr) =>
          previousInteractive.some((p) => p.id === curr.id && p.text !== curr.text)
      );

      setDifferences({ added, removed, changed });
    }
  }, [current]);

  return {
    previous,
    current,
    differences,
    updatePerception,
  };
}
