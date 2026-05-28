import { useCallback, useState, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';

const { ActionExecutorBridge } = NativeModules;

/**
 * Execution Result Type
 */
export interface ExecutionResult {
  success: boolean;
  message: string;
  duration: number;
}

/**
 * Element Info Type
 */
export interface ElementInfo {
  text: string;
  contentDescription: string;
  className: string;
  centerX: number;
  centerY: number;
  isClickable: boolean;
  isEditable: boolean;
  isEnabled: boolean;
}

/**
 * Execution Stats Type
 */
export interface ExecutionStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
}

/**
 * Macro Execution Summary Type
 */
export interface MacroExecutionSummary {
  macroId: string;
  duration: number;
  success: boolean;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  successRate: number;
}

/**
 * Hook for Action Executor functionality
 */
export function useActionExecutor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const executorRef = useRef(ActionExecutorBridge);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize action executor
   */
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS === 'android' && executorRef.current) {
        await executorRef.current.initialize();
        setIsInitialized(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error initializing executor:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Execute tap action
   */
  const tap = useCallback(
    async (x: number, y: number, delay: number = 300): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.tap(x, y, delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error tapping:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute long tap action
   */
  const longTap = useCallback(
    async (x: number, y: number, duration: number = 500, delay: number = 300): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.longTap(x, y, duration, delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error long tapping:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute swipe action
   */
  const swipe = useCallback(
    async (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      duration: number = 500,
      delay: number = 300
    ): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.swipe(startX, startY, endX, endY, duration, delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error swiping:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute type text action
   */
  const typeText = useCallback(
    async (text: string, delay: number = 50): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.typeText(text, delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error typing text:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute clear text action
   */
  const clearText = useCallback(
    async (delay: number = 300): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.clearText(delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error clearing text:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute scroll action
   */
  const scroll = useCallback(
    async (direction: string, distance: number = 500, delay: number = 300): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.scroll(direction, distance, delay);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error scrolling:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Execute wait action
   */
  const wait = useCallback(
    async (duration: number): Promise<ExecutionResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.wait(duration);
          return result as ExecutionResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error waiting:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Find element by text
   */
  const findElementByText = useCallback(
    async (text: string): Promise<ElementInfo | null> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.findElementByText(text);
          return result as ElementInfo;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error finding element:', err);
        return null;
      }
    },
    []
  );

  /**
   * Get all clickable elements
   */
  const getAllClickableElements = useCallback(
    async (): Promise<ElementInfo[] | null> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.getAllClickableElements();
          return result as ElementInfo[];
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error getting clickable elements:', err);
        return null;
      }
    },
    []
  );

  /**
   * Get execution log
   */
  const getExecutionLog = useCallback(
    async (macroId?: string): Promise<any[] | null> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.getExecutionLog(macroId);
          return result as any[];
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error getting execution log:', err);
        return null;
      }
    },
    []
  );

  /**
   * Get execution statistics
   */
  const getExecutionStats = useCallback(
    async (): Promise<ExecutionStats | null> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.getExecutionStats();
          return result as ExecutionStats;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error getting stats:', err);
        return null;
      }
    },
    []
  );

  /**
   * Start macro execution
   */
  const startMacroExecution = useCallback(
    async (macroId: string): Promise<boolean> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.startMacroExecution(macroId);
          return result as boolean;
        }
        return false;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error starting macro:', err);
        return false;
      }
    },
    []
  );

  /**
   * End macro execution
   */
  const endMacroExecution = useCallback(
    async (success: boolean, error?: string): Promise<MacroExecutionSummary | null> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.endMacroExecution(success, error);
          return result as MacroExecutionSummary;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error ending macro:', err);
        return null;
      }
    },
    []
  );

  /**
   * Clear execution log
   */
  const clearExecutionLog = useCallback(
    async (): Promise<boolean> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && executorRef.current) {
          const result = await executorRef.current.clearExecutionLog();
          return result as boolean;
        }
        return false;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error clearing log:', err);
        return false;
      }
    },
    []
  );

  return {
    // State
    isLoading,
    error,
    isInitialized,

    // Initialization
    initialize,

    // Gesture actions
    tap,
    longTap,
    swipe,
    typeText,
    clearText,
    scroll,
    wait,

    // Element detection
    findElementByText,
    getAllClickableElements,

    // Execution tracking
    getExecutionLog,
    getExecutionStats,
    startMacroExecution,
    endMacroExecution,
    clearExecutionLog,
  };
}
