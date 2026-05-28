import { useState, useCallback, useRef } from 'react';
import { Macro, MacroExecution, MacroManager } from '../models/Macro';
import MacroExecutionEngine from '../engines/MacroExecutionEngine';

export interface UseMacroExecutionState {
  macros: Macro[];
  currentExecution: MacroExecution | null;
  isExecuting: boolean;
  isPaused: boolean;
  error: string | null;
  progress: number;
}

export function useMacroExecution() {
  const [state, setState] = useState<UseMacroExecutionState>({
    macros: [],
    currentExecution: null,
    isExecuting: false,
    isPaused: false,
    error: null,
    progress: 0,
  });

  const engineRef = useRef(new MacroExecutionEngine());

  // Load all macros
  const loadMacros = useCallback(async () => {
    try {
      const macros = await MacroManager.getAll();
      setState((prev) => ({ ...prev, macros }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load macros';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, []);

  // Create macro from execution history
  const createFromHistory = useCallback(
    async (executionIds: string[], name: string, description?: string) => {
      try {
        const macro = await MacroManager.createFromExecutionHistory(executionIds, name, description);
        setState((prev) => ({
          ...prev,
          macros: [...prev.macros, macro],
          error: null,
        }));
        return macro;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create macro';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  // Create macro from template
  const createFromTemplate = useCallback(async (templateKey: string, overrides?: Partial<Macro>) => {
    try {
      const macro = await MacroManager.createFromTemplate(templateKey, overrides);
      setState((prev) => ({
        ...prev,
        macros: [...prev.macros, macro],
        error: null,
      }));
      return macro;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create macro';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Execute macro
  const executeMacro = useCallback(
    async (macro: Macro, variables?: Record<string, any>) => {
      try {
        setState((prev) => ({
          ...prev,
          isExecuting: true,
          error: null,
          progress: 0,
        }));

        const execution = await engineRef.current.executeMacro(macro, {
          variables,
          stopOnError: false,
          retryFailedSteps: true,
          onProgress: (progress) => {
            setState((prev) => ({ ...prev, progress }));
          },
          onStepError: (stepIndex, error) => {
            console.error(`Step ${stepIndex} error: ${error}`);
          },
        });

        // Record execution
        await MacroManager.recordExecution(execution);

        setState((prev) => ({
          ...prev,
          currentExecution: execution,
          isExecuting: false,
          progress: 100,
        }));

        return execution;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Execution failed';
        setState((prev) => ({
          ...prev,
          isExecuting: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    []
  );

  // Pause execution
  const pauseExecution = useCallback(() => {
    engineRef.current.pause();
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  // Resume execution
  const resumeExecution = useCallback(() => {
    engineRef.current.resume();
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    engineRef.current.cancel();
    setState((prev) => ({
      ...prev,
      isExecuting: false,
      isPaused: false,
      error: 'Execution cancelled',
    }));
  }, []);

  // Delete macro
  const deleteMacro = useCallback(async (id: string) => {
    try {
      await MacroManager.deleteMacro(id);
      setState((prev) => ({
        ...prev,
        macros: prev.macros.filter((m) => m.id !== id),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete macro';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await MacroManager.toggleFavorite(id);
      const macro = await MacroManager.getById(id);
      if (macro) {
        setState((prev) => ({
          ...prev,
          macros: prev.macros.map((m) => (m.id === id ? macro : m)),
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle favorite';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Get execution history
  const getExecutionHistory = useCallback(async (macroId: string, limit?: number) => {
    try {
      return await MacroManager.getExecutionHistory(macroId, limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get history';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return [];
    }
  }, []);

  // Export macro
  const exportMacro = useCallback(async (id: string) => {
    try {
      return await MacroManager.exportMacro(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export macro';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Import macro
  const importMacro = useCallback(async (jsonData: string) => {
    try {
      const macro = await MacroManager.importMacro(jsonData);
      setState((prev) => ({
        ...prev,
        macros: [...prev.macros, macro],
      }));
      return macro;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import macro';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  return {
    ...state,
    loadMacros,
    createFromHistory,
    createFromExecutionHistory: createFromHistory, // Alias for createFromHistory
    createFromTemplate,
    executeMacro,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    deleteMacro,
    toggleFavorite,
    getExecutionHistory,
    exportMacro,
    importMacro,
  };
}
