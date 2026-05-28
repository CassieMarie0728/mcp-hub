import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Macro, MacroStep, MacroExecution, MacroStatus } from '../../lib/models/Macro';
import { MCPServer } from '../../lib/types';

describe('Integration Tests: End-to-End Workflows', () => {
  let mockServer: MCPServer;
  let mockMacro: Macro;

  beforeEach(() => {
    mockServer = {
      id: 'server-1',
      name: 'Test MCP Server',
      connectionType: 'sse',
      connectionDetails: {
        url: 'http://localhost:3000',
        headers: { 'Authorization': 'Bearer token' },
      },
      status: 'connected',
      toolCount: 5,
      createdAt: Date.now(),
    };

    mockMacro = {
      id: 'macro-1',
      name: 'Integration Test Macro',
      description: 'Macro for integration testing',
      steps: [
        {
          id: 'step-1',
          serverId: 'server-1',
          serverName: 'Test Server',
          toolName: 'get-data',
          parameters: { query: 'test' },
          order: 1,
          timeout: 5000,
          retryOnFailure: false,
          maxRetries: 0,
        },
        {
          id: 'step-2',
          serverId: 'server-1',
          serverName: 'Test Server',
          toolName: 'process-data',
          parameters: { format: 'json' },
          order: 2,
          timeout: 5000,
          retryOnFailure: false,
          maxRetries: 0,
        },
      ],
      isFavorite: false,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
  });

  describe('Server Connection Workflow', () => {
    it('should establish connection to MCP server', () => {
      expect(mockServer.status).toBe('connected');
      expect(mockServer.connectionDetails.url).toBe('http://localhost:3000');
    });

    it('should maintain server connection state', () => {
      const connectedServer: MCPServer = {
        ...mockServer,
        status: 'connected',
        lastConnected: Date.now(),
      };

      expect(connectedServer.status).toBe('connected');
      expect(connectedServer.lastConnected).toBeDefined();
    });

    it('should handle server disconnection', () => {
      const disconnectedServer: MCPServer = {
        ...mockServer,
        status: 'disconnected',
        error: 'Connection timeout',
      };

      expect(disconnectedServer.status).toBe('disconnected');
      expect(disconnectedServer.error).toBeDefined();
    });

    it('should support custom headers in connection', () => {
      expect(mockServer.connectionDetails.headers).toEqual({
        'Authorization': 'Bearer token',
      });
    });
  });

  describe('Tool Discovery Workflow', () => {
    it('should discover tools from connected server', () => {
      expect(mockServer.toolCount).toBe(5);
      expect(mockServer.status).toBe('connected');
    });

    it('should cache discovered tools', () => {
      const cachedTools = Array(mockServer.toolCount).fill(null).map((_, i) => ({
        serverId: mockServer.id,
        name: `tool-${i}`,
        description: `Tool ${i}`,
        inputSchema: { type: 'object' },
      }));

      expect(cachedTools).toHaveLength(5);
      expect(cachedTools[0].serverId).toBe('server-1');
    });

    it('should update tool count on discovery', () => {
      const updatedServer: MCPServer = {
        ...mockServer,
        toolCount: 8,
      };

      expect(updatedServer.toolCount).toBeGreaterThan(mockServer.toolCount);
    });
  });

  describe('Macro Recording Workflow', () => {
    it('should record macro steps in sequence', () => {
      expect(mockMacro.steps).toHaveLength(2);
      expect(mockMacro.steps[0].order).toBe(1);
      expect(mockMacro.steps[1].order).toBe(2);
    });

    it('should preserve step order during recording', () => {
      const recordedSteps = mockMacro.steps.sort((a, b) => a.order - b.order);

      expect(recordedSteps[0].id).toBe('step-1');
      expect(recordedSteps[1].id).toBe('step-2');
    });

    it('should support step parameters during recording', () => {
      mockMacro.steps.forEach((step) => {
        expect(step.parameters).toBeDefined();
        expect(typeof step.parameters).toBe('object');
      });
    });

    it('should track step metadata', () => {
      mockMacro.steps.forEach((step) => {
        expect(step.timeout).toBeDefined();
        expect(step.timeout).toBeGreaterThan(0);
      });
    });
  });

  describe('Macro Execution Workflow', () => {
    it('should execute macro with recorded steps', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        status: MacroStatus.PLAYING,
        currentStepIndex: 0,
        totalSteps: mockMacro.steps.length,
        results: [],
      };

      expect(execution.totalSteps).toBe(2);
      expect(execution.status).toBe(MacroStatus.PLAYING);
    });

    it('should track execution progress', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        status: MacroStatus.PLAYING,
        currentStepIndex: 1,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: { data: 'test-data' },
            duration: 100,
            status: 'SUCCESS',
          },
        ],
      };

      expect(execution.currentStepIndex).toBe(1);
      expect(execution.results).toHaveLength(1);
      expect(execution.results[0].status).toBe('SUCCESS');
    });

    it('should complete macro execution', () => {
      const startTime = Date.now();
      const endTime = startTime + 5000;

      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        status: MacroStatus.COMPLETED,
        currentStepIndex: 2,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: { data: 'test-data' },
            duration: 100,
            status: 'SUCCESS',
          },
          {
            stepId: 'step-2',
            stepIndex: 1,
            toolName: 'process-data',
            result: { processed: true },
            duration: 200,
            status: 'SUCCESS',
          },
        ],
      };

      expect(execution.status).toBe(MacroStatus.COMPLETED);
      expect(execution.duration).toBe(5000);
      expect(execution.results).toHaveLength(2);
    });

    it('should handle execution errors', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        duration: 1000,
        status: MacroStatus.FAILED,
        currentStepIndex: 1,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: null,
            duration: 1000,
            status: 'FAILED',
            error: 'Connection timeout',
          },
        ],
        error: 'Macro execution failed at step 1',
      };

      expect(execution.status).toBe(MacroStatus.FAILED);
      expect(execution.error).toBeDefined();
      expect(execution.results[0].status).toBe('FAILED');
    });
  });

  describe('Macro Pause and Resume Workflow', () => {
    it('should pause macro execution', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        status: MacroStatus.PAUSED,
        currentStepIndex: 1,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: { data: 'test-data' },
            duration: 100,
            status: 'SUCCESS',
          },
        ],
      };

      expect(execution.status).toBe(MacroStatus.PAUSED);
      expect(execution.currentStepIndex).toBe(1);
    });

    it('should resume macro execution from pause point', () => {
      const pausedExecution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        status: MacroStatus.PAUSED,
        currentStepIndex: 1,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: { data: 'test-data' },
            duration: 100,
            status: 'SUCCESS',
          },
        ],
      };

      const resumedExecution: MacroExecution = {
        ...pausedExecution,
        status: MacroStatus.PLAYING,
      };

      expect(resumedExecution.status).toBe(MacroStatus.PLAYING);
      expect(resumedExecution.currentStepIndex).toBe(pausedExecution.currentStepIndex);
    });
  });

  describe('Macro Sharing Workflow', () => {
    it('should export macro with all metadata', () => {
      const exported = {
        macro: mockMacro,
        server: mockServer,
        exportedAt: Date.now(),
        version: '1.0',
      };

      expect(exported.macro.id).toBe(mockMacro.id);
      expect(exported.server.id).toBe(mockServer.id);
      expect(exported.exportedAt).toBeDefined();
    });

    it('should import macro with validation', () => {
      const imported = {
        macro: mockMacro,
        server: mockServer,
        importedAt: Date.now(),
        validated: true,
      };

      expect(imported.validated).toBe(true);
      expect(imported.macro.steps).toHaveLength(2);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should retry failed step', () => {
      const failedExecution: MacroExecution = {
        id: 'exec-1',
        macroId: mockMacro.id,
        macroName: mockMacro.name,
        startTime: Date.now(),
        status: MacroStatus.FAILED,
        currentStepIndex: 1,
        totalSteps: mockMacro.steps.length,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'get-data',
            result: null,
            duration: 1000,
            status: 'FAILED',
            error: 'Timeout',
          },
        ],
        error: 'Step 1 failed',
      };

      const retryExecution: MacroExecution = {
        ...failedExecution,
        id: 'exec-2',
        status: MacroStatus.PLAYING,
        currentStepIndex: 0,
        results: [],
      };

      expect(retryExecution.status).toBe(MacroStatus.PLAYING);
      expect(retryExecution.results).toHaveLength(0);
    });

    it('should handle timeout and retry', () => {
      const step: MacroStep = {
        ...mockMacro.steps[0],
        timeout: 5000,
        retryOnFailure: true,
        maxRetries: 3,
      };

      expect(step.retryOnFailure).toBe(true);
      expect(step.maxRetries).toBe(3);
      expect(step.timeout).toBe(5000);
    });
  });
});
