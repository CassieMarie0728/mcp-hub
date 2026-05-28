import { useCallback, useState, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';

const { IntentParserBridge } = NativeModules;

/**
 * Parsed Intent Type
 */
export interface ParsedIntent {
  intentName: string;
  confidence: number;
  entities: Record<string, string>;
  actions: Action[];
  isValid: boolean;
}

/**
 * Action Type
 */
export interface Action {
  type: string;
  parameters: Record<string, string>;
  delay: number;
  retryCount: number;
}

/**
 * Validation Result Type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Execution Record Type
 */
export interface ExecutionRecord {
  timestamp: number;
  actionType: string;
  parameters: Record<string, string>;
  success: boolean;
  error?: string;
  duration: number;
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
 * Hook for Intent Parser functionality
 */
export function useIntentParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parserRef = useRef(IntentParserBridge);

  /**
   * Parse natural language intent
   */
  const parseIntent = useCallback(async (input: string): Promise<ParsedIntent | null> => {
    if (!input.trim()) {
      setError('Input cannot be empty');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.parseIntent(input);
        return result as ParsedIntent;
      } else {
        // Fallback for non-Android platforms
        console.warn('Intent Parser only available on Android');
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error parsing intent:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Extract entities from text
   */
  const extractEntities = useCallback(
    async (input: string): Promise<Record<string, string> | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && parserRef.current) {
          const result = await parserRef.current.extractEntities(input);
          return result as Record<string, string>;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error extracting entities:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Validate action sequence
   */
  const validateActions = useCallback(
    async (actions: Action[]): Promise<ValidationResult | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (Platform.OS === 'android' && parserRef.current) {
          const result = await parserRef.current.validateActions(actions);
          return result as ValidationResult;
        }
        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error validating actions:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Substitute variables in text
   */
  const substituteVariables = useCallback(async (text: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.substituteVariables(text);
        return result as string;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error substituting variables:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set variable
   */
  const setVariable = useCallback(async (name: string, value: string): Promise<boolean> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.setVariable(name, value);
        return result as boolean;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error setting variable:', err);
      return false;
    }
  }, []);

  /**
   * Get variable
   */
  const getVariable = useCallback(async (name: string): Promise<string | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.getVariable(name);
        return result as string;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error getting variable:', err);
      return null;
    }
  }, []);

  /**
   * Get all variables
   */
  const getAllVariables = useCallback(async (): Promise<Record<string, string> | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.getAllVariables();
        return result as Record<string, string>;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error getting all variables:', err);
      return null;
    }
  }, []);

  /**
   * Clear variables
   */
  const clearVariables = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.clearVariables();
        return result as boolean;
      }
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error clearing variables:', err);
      return false;
    }
  }, []);

  /**
   * Record action execution
   */
  const recordExecution = useCallback(
    async (
      actionType: string,
      parameters: Record<string, string>,
      success: boolean,
      error?: string,
      duration: number = 0,
    ): Promise<boolean> => {
      try {
        setError(null);

        if (Platform.OS === 'android' && parserRef.current) {
          const result = await parserRef.current.recordExecution(
            actionType,
            parameters,
            success,
            error,
            duration,
          );
          return result as boolean;
        }
        return false;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error recording execution:', err);
        return false;
      }
    },
    [],
  );

  /**
   * Get execution history
   */
  const getExecutionHistory = useCallback(async (): Promise<ExecutionRecord[] | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.getExecutionHistory();
        return result as ExecutionRecord[];
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error getting execution history:', err);
      return null;
    }
  }, []);

  /**
   * Get execution statistics
   */
  const getExecutionStats = useCallback(async (): Promise<ExecutionStats | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.getExecutionStats();
        return result as ExecutionStats;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error getting execution stats:', err);
      return null;
    }
  }, []);

  /**
   * Estimate execution time
   */
  const estimateExecutionTime = useCallback(async (actions: Action[]): Promise<number | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.estimateExecutionTime(actions);
        return result as number;
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error estimating execution time:', err);
      return null;
    }
  }, []);

  /**
   * Optimize action sequence
   */
  const optimizeActions = useCallback(async (actions: Action[]): Promise<Action[] | null> => {
    try {
      setError(null);

      if (Platform.OS === 'android' && parserRef.current) {
        const result = await parserRef.current.optimizeActions(actions);
        return result as Action[];
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error optimizing actions:', err);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    error,

    // Intent parsing
    parseIntent,
    extractEntities,

    // Action validation
    validateActions,
    estimateExecutionTime,
    optimizeActions,

    // Variable management
    substituteVariables,
    setVariable,
    getVariable,
    getAllVariables,
    clearVariables,

    // Execution tracking
    recordExecution,
    getExecutionHistory,
    getExecutionStats,
  };
}
