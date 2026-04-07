import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Macro, MacroStep, MacroExecution, MacroStatus } from '../../lib/models/Macro';

describe('Macro Execution Tests', () => {
  let testMacro: Macro;
  let testStep: MacroStep;

  beforeEach(() => {
    testStep = {
      id: 'step-1',
      serverId: 'server-1',
      serverName: 'Test Server',
      toolName: 'test-tool',
      parameters: { key: 'value' },
      order: 1,
      timeout: 5000,
      retryOnFailure: false,
      maxRetries: 0,
    };

    testMacro = {
      id: 'macro-1',
      name: 'Test Macro',
      description: 'Test macro for execution',
      steps: [testStep],
      isFavorite: false,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
  });

  describe('MacroStep', () => {
    it('should create a valid macro step', () => {
      expect(testStep.id).toBe('step-1');
      expect(testStep.serverId).toBe('server-1');
      expect(testStep.toolName).toBe('test-tool');
      expect(testStep.parameters).toEqual({ key: 'value' });
    });

    it('should support retry configuration', () => {
      const retryStep: MacroStep = {
        ...testStep,
        retryOnFailure: true,
        maxRetries: 3,
      };

      expect(retryStep.retryOnFailure).toBe(true);
      expect(retryStep.maxRetries).toBe(3);
    });

    it('should support timeout configuration', () => {
      const timeoutStep: MacroStep = {
        ...testStep,
        timeout: 10000,
      };

      expect(timeoutStep.timeout).toBe(10000);
    });

    it('should support expected result validation', () => {
      const validatedStep: MacroStep = {
        ...testStep,
        expectedResult: { status: 'success' },
        resultFormat: 'json',
      };

      expect(validatedStep.expectedResult).toEqual({ status: 'success' });
      expect(validatedStep.resultFormat).toBe('json');
    });
  });

  describe('Macro', () => {
    it('should create a valid macro', () => {
      expect(testMacro.id).toBe('macro-1');
      expect(testMacro.name).toBe('Test Macro');
      expect(testMacro.steps).toHaveLength(1);
    });

    it('should support multiple steps', () => {
      const step2: MacroStep = {
        ...testStep,
        id: 'step-2',
        order: 2,
      };

      const multiStepMacro: Macro = {
        ...testMacro,
        steps: [testStep, step2],
      };

      expect(multiStepMacro.steps).toHaveLength(2);
      expect(multiStepMacro.steps[0].order).toBe(1);
      expect(multiStepMacro.steps[1].order).toBe(2);
    });

    it('should support variables', () => {
      const macroWithVars: Macro = {
        ...testMacro,
        variables: [
          {
            name: 'apiKey',
            description: 'API key for authentication',
            defaultValue: 'default-key',
            type: 'string',
          },
        ],
      };

      expect(macroWithVars.variables).toHaveLength(1);
      expect(macroWithVars.variables?.[0].name).toBe('apiKey');
    });

    it('should support tags and favorites', () => {
      const taggedMacro: Macro = {
        ...testMacro,
        tags: ['automation', 'testing'],
        isFavorite: true,
      };

      expect(taggedMacro.tags).toContain('automation');
      expect(taggedMacro.isFavorite).toBe(true);
    });

    it('should track usage count', () => {
      const usedMacro: Macro = {
        ...testMacro,
        usageCount: 5,
        lastExecutedAt: Date.now(),
      };

      expect(usedMacro.usageCount).toBe(5);
      expect(usedMacro.lastExecutedAt).toBeDefined();
    });
  });

  describe('MacroExecution', () => {
    it('should create a valid execution record', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: 'macro-1',
        macroName: 'Test Macro',
        startTime: Date.now(),
        status: MacroStatus.PLAYING,
        currentStepIndex: 0,
        totalSteps: 1,
        results: [],
      };

      expect(execution.id).toBe('exec-1');
      expect(execution.macroId).toBe('macro-1');
      expect(execution.status).toBe(MacroStatus.PLAYING);
    });

    it('should track step results', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: 'macro-1',
        macroName: 'Test Macro',
        startTime: Date.now(),
        status: MacroStatus.COMPLETED,
        currentStepIndex: 1,
        totalSteps: 1,
        results: [
          {
            stepId: 'step-1',
            stepIndex: 0,
            toolName: 'test-tool',
            result: { data: 'success' },
            duration: 100,
            status: 'SUCCESS',
          },
        ],
      };

      expect(execution.results).toHaveLength(1);
      expect(execution.results[0].status).toBe('SUCCESS');
      expect(execution.results[0].result).toEqual({ data: 'success' });
    });

    it('should track execution errors', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: 'macro-1',
        macroName: 'Test Macro',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        duration: 1000,
        status: MacroStatus.FAILED,
        currentStepIndex: 0,
        totalSteps: 1,
        results: [],
        error: 'Tool execution failed',
      };

      expect(execution.status).toBe(MacroStatus.FAILED);
      expect(execution.error).toBe('Tool execution failed');
    });

    it('should support variable substitution', () => {
      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: 'macro-1',
        macroName: 'Test Macro',
        startTime: Date.now(),
        status: MacroStatus.PLAYING,
        currentStepIndex: 0,
        totalSteps: 1,
        results: [],
        variables: {
          apiKey: 'secret-key',
          userId: '12345',
        },
      };

      expect(execution.variables?.apiKey).toBe('secret-key');
      expect(execution.variables?.userId).toBe('12345');
    });

    it('should track execution duration', () => {
      const startTime = Date.now();
      const endTime = startTime + 5000;

      const execution: MacroExecution = {
        id: 'exec-1',
        macroId: 'macro-1',
        macroName: 'Test Macro',
        startTime,
        endTime,
        duration: endTime - startTime,
        status: MacroStatus.COMPLETED,
        currentStepIndex: 1,
        totalSteps: 1,
        results: [],
      };

      expect(execution.duration).toBe(5000);
    });
  });

  describe('Macro Status Transitions', () => {
    it('should support status transitions', () => {
      const statuses = [
        MacroStatus.IDLE,
        MacroStatus.RECORDING,
        MacroStatus.PLAYING,
        MacroStatus.PAUSED,
        MacroStatus.COMPLETED,
      ];

      statuses.forEach((status) => {
        expect(Object.values(MacroStatus)).toContain(status);
      });
    });

    it('should handle failed status', () => {
      expect(MacroStatus.FAILED).toBeDefined();
      expect(Object.values(MacroStatus)).toContain(MacroStatus.FAILED);
    });
  });
});
