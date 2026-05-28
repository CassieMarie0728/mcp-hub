import { NativeModules } from 'react-native';
import { useState, useCallback } from 'react';

const { MCPMacroBridge } = NativeModules;

export interface Macro {
  id: string;
  name: string;
  description: string;
  intent: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: number;
  averageExecutionTime: number;
}

export interface MacroExecutionResult {
  macroId: string;
  macroName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  error?: string;
  output?: string;
}

export interface MacroStatistics {
  totalMacros: number;
  activeMacros: number;
  totalExecutions: number;
  averageExecutionTime: number;
  mostUsedMacro?: string;
  lastExecutedMacro?: string;
}

export function useMacros() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMacro = useCallback(
    async (
      name: string,
      description: string,
      intent: string,
      parameters: any[] = [],
      actions: any[] = [],
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await MCPMacroBridge.createMacro(
          name,
          description,
          intent,
          parameters,
          actions,
        );
        setMacros((prev) => [...prev, result]);
        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to create macro';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getMacro = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await MCPMacroBridge.getMacro(id);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get macro';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllMacros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await MCPMacroBridge.getAllMacros();
      setMacros(result || []);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get macros';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMacro = useCallback(async (macro: Macro) => {
    setLoading(true);
    setError(null);
    try {
      const result = await MCPMacroBridge.updateMacro(JSON.stringify(macro));
      setMacros((prev) => prev.map((m) => (m.id === macro.id ? result : m)));
      return result;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update macro';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMacro = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await MCPMacroBridge.deleteMacro(id);
      setMacros((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete macro';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeMacro = useCallback(
    async (
      macroId: string,
      parameters: Record<string, string> = {},
    ): Promise<MacroExecutionResult> => {
      setLoading(true);
      setError(null);
      try {
        return await MCPMacroBridge.executeMacro(macroId, JSON.stringify(parameters));
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to execute macro';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const parseIntent = useCallback(async (intentString: string) => {
    setLoading(true);
    setError(null);
    try {
      return await MCPMacroBridge.parseIntent(intentString);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to parse intent';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMacros = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      return await MCPMacroBridge.searchMacros(query);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to search macros';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatistics = useCallback(async (): Promise<MacroStatistics> => {
    setLoading(true);
    setError(null);
    try {
      return await MCPMacroBridge.getStatistics();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get statistics';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportMacros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      return await MCPMacroBridge.exportMacros();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to export macros';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importMacros = useCallback(
    async (json: string) => {
      setLoading(true);
      setError(null);
      try {
        const count = await MCPMacroBridge.importMacros(json);
        await getAllMacros();
        return count;
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to import macros';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAllMacros],
  );

  return {
    macros,
    loading,
    error,
    createMacro,
    getMacro,
    getAllMacros,
    updateMacro,
    deleteMacro,
    executeMacro,
    parseIntent,
    searchMacros,
    getStatistics,
    exportMacros,
    importMacros,
  };
}
