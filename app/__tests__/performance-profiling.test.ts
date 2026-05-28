/**
 * Performance Profiling Test Suite
 * Measures and analyzes macro execution, tool discovery, and memory usage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PerformanceProfiler from '../../lib/utils/PerformanceProfiler';
import type { PerformanceStats } from '../../lib/utils/PerformanceProfiler';

describe('Performance Profiling', () => {
  beforeEach(() => {
    PerformanceProfiler.clearAll();
  });

  afterEach(() => {
    PerformanceProfiler.logSummary();
  });

  describe('Macro Execution Performance', () => {
    it('should profile single macro execution', () => {
      PerformanceProfiler.startMeasure('macro_execution_single', { macroId: 'test-1' });

      // Simulate macro execution (tap, type, wait)
      for (let i = 0; i < 100; i++) {
        // Simulate action processing
        Math.sqrt(i);
      }

      const duration = PerformanceProfiler.endMeasure('macro_execution_single');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should profile sequential macro steps', () => {
      const steps = ['tap', 'type', 'wait', 'swipe', 'tap'];

      PerformanceProfiler.startMeasure('macro_sequential_steps');

      steps.forEach((step, index) => {
        PerformanceProfiler.startMeasure(`step_${step}_${index}`);
        // Simulate step execution
        for (let i = 0; i < 50; i++) {
          Math.sqrt(i);
        }
        PerformanceProfiler.endMeasure(`step_${step}_${index}`);
      });

      const duration = PerformanceProfiler.endMeasure('macro_sequential_steps');
      expect(duration).toBeGreaterThan(0);

      // Verify each step was measured
      steps.forEach((step, index) => {
        const stats = PerformanceProfiler.getStats(`step_${step}_${index}`);
        expect(stats).toBeDefined();
        if (stats) {
          expect(stats.count).toBe(1);
        }
      });
    });

    it('should profile parallel macro execution', () => {
      const macroCount = 5;

      PerformanceProfiler.startMeasure('macro_parallel_execution');

      // Simulate parallel execution
      const promises = Array.from({ length: macroCount }).map((_, i) => {
        PerformanceProfiler.startMeasure(`macro_${i}`);
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            PerformanceProfiler.endMeasure(`macro_${i}`);
            resolve();
          }, 10);
        });
      });

      return Promise.all(promises).then(() => {
        PerformanceProfiler.endMeasure('macro_parallel_execution');

        // Verify all macros were measured
        for (let i = 0; i < macroCount; i++) {
          const stats = PerformanceProfiler.getStats(`macro_${i}`);
          expect(stats).toBeDefined();
        }
      });
    });

    it('should measure macro with variable substitution', () => {
      PerformanceProfiler.startMeasure('macro_variable_substitution');

      const variables = {
        contact: 'John Doe',
        message: 'Hello, how are you?',
        timestamp: new Date().toISOString(),
      };

      // Simulate variable substitution
      const template = 'Send message to ${contact}: ${message} at ${timestamp}';
      let result = template;
      Object.entries(variables).forEach(([key, value]) => {
        result = result.replace(`\${${key}}`, String(value));
      });

      PerformanceProfiler.endMeasure('macro_variable_substitution');

      const stats = PerformanceProfiler.getStats('macro_variable_substitution');
      expect(stats).toBeDefined();
      expect(stats?.lastMeasurement).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Tool Discovery Performance', () => {
    it('should profile tool discovery from single server', () => {
      PerformanceProfiler.startMeasure('tool_discovery_single_server');

      // Simulate discovering 50 tools
      const tools = Array.from({ length: 50 }).map((_, i) => ({
        id: `tool_${i}`,
        name: `Tool ${i}`,
        description: `Description for tool ${i}`,
        parameters: { count: Math.random() * 10 },
      }));

      // Simulate processing
      tools.forEach((tool) => {
        JSON.stringify(tool);
      });

      PerformanceProfiler.endMeasure('tool_discovery_single_server');

      const stats = PerformanceProfiler.getStats('tool_discovery_single_server');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(1);
    });

    it('should profile tool discovery from multiple servers', () => {
      const serverCount = 5;
      const toolsPerServer = 30;

      PerformanceProfiler.startMeasure('tool_discovery_multiple_servers');

      // Simulate discovering tools from multiple servers
      for (let s = 0; s < serverCount; s++) {
        PerformanceProfiler.startMeasure(`server_${s}_discovery`);

        const tools = Array.from({ length: toolsPerServer }).map((_, i) => ({
          id: `server_${s}_tool_${i}`,
          name: `Tool ${i}`,
          description: `Description for tool ${i}`,
        }));

        tools.forEach((tool) => {
          JSON.stringify(tool);
        });

        PerformanceProfiler.endMeasure(`server_${s}_discovery`);
      }

      PerformanceProfiler.endMeasure('tool_discovery_multiple_servers');

      const stats = PerformanceProfiler.getStats('tool_discovery_multiple_servers');
      expect(stats).toBeDefined();
    });

    it('should profile tool filtering and search', () => {
      PerformanceProfiler.startMeasure('tool_filtering_search');

      const tools = Array.from({ length: 200 }).map((_, i) => ({
        id: `tool_${i}`,
        name: `Tool ${i}`,
        description: `Description for tool ${i}`,
        category: ['filesystem', 'web', 'communication', 'system'][i % 4],
      }));

      // Simulate search and filter
      const searchQuery = 'tool';
      const category = 'filesystem';

      const filtered = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) && tool.category === category,
      );

      PerformanceProfiler.endMeasure('tool_filtering_search');

      const stats = PerformanceProfiler.getStats('tool_filtering_search');
      expect(stats).toBeDefined();
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Patterns', () => {
    it('should measure memory for macro state', () => {
      PerformanceProfiler.startMeasure('memory_macro_state');

      // Simulate macro state accumulation
      const macroStates = Array.from({ length: 100 }).map((_, i) => ({
        id: `macro_${i}`,
        name: `Macro ${i}`,
        steps: Array.from({ length: 10 }).map((_, j) => ({
          id: `step_${j}`,
          type: ['tap', 'type', 'swipe'][j % 3],
          data: { x: Math.random() * 1000, y: Math.random() * 1000 },
        })),
        variables: { count: i, timestamp: Date.now() },
      }));

      // Simulate memory usage
      const memoryUsage = JSON.stringify(macroStates).length;

      PerformanceProfiler.endMeasure('memory_macro_state');

      const stats = PerformanceProfiler.getStats('memory_macro_state');
      expect(stats).toBeDefined();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it('should measure memory for execution history', () => {
      PerformanceProfiler.startMeasure('memory_execution_history');

      // Simulate execution history accumulation
      const executionHistory = Array.from({ length: 500 }).map((_, i) => ({
        id: `execution_${i}`,
        macroId: `macro_${i % 10}`,
        status: ['success', 'failed', 'pending'][i % 3],
        startTime: Date.now() - Math.random() * 86400000,
        endTime: Date.now(),
        result: { steps: i, duration: Math.random() * 5000 },
      }));

      const memoryUsage = JSON.stringify(executionHistory).length;

      PerformanceProfiler.endMeasure('memory_execution_history');

      const stats = PerformanceProfiler.getStats('memory_execution_history');
      expect(stats).toBeDefined();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it('should measure memory for cached tool definitions', () => {
      PerformanceProfiler.startMeasure('memory_tool_cache');

      // Simulate tool cache
      const toolCache = new Map();
      for (let i = 0; i < 150; i++) {
        toolCache.set(`tool_${i}`, {
          id: `tool_${i}`,
          name: `Tool ${i}`,
          description: `Description for tool ${i}`,
          schema: {
            type: 'object',
            properties: {
              param1: { type: 'string' },
              param2: { type: 'number' },
              param3: { type: 'boolean' },
            },
          },
        });
      }

      const memoryUsage = JSON.stringify(Array.from(toolCache.values())).length;

      PerformanceProfiler.endMeasure('memory_tool_cache');

      const stats = PerformanceProfiler.getStats('memory_tool_cache');
      expect(stats).toBeDefined();
      expect(toolCache.size).toBe(150);
    });
  });

  describe('Performance Statistics', () => {
    it('should calculate accurate performance statistics', () => {
      // Run multiple measurements
      for (let i = 0; i < 10; i++) {
        PerformanceProfiler.startMeasure('repeated_operation');
        // Simulate operation
        for (let j = 0; j < 100; j++) {
          Math.sqrt(j);
        }
        PerformanceProfiler.endMeasure('repeated_operation');
      }

      const stats = PerformanceProfiler.getStats('repeated_operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(10);
      expect(stats!.averageTime).toBeGreaterThan(0);
      expect(stats!.minTime).toBeLessThanOrEqual(stats!.averageTime);
      expect(stats!.maxTime).toBeGreaterThanOrEqual(stats!.averageTime);
    });

    it('should export metrics as JSON', () => {
      PerformanceProfiler.startMeasure('test_metric_1');
      for (let i = 0; i < 50; i++) {
        Math.sqrt(i);
      }
      PerformanceProfiler.endMeasure('test_metric_1');

      const exported = PerformanceProfiler.exportMetrics();
      expect(exported).toBeDefined();

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('metric');
      expect(parsed[0]).toHaveProperty('count');
      expect(parsed[0]).toHaveProperty('averageTime');
    });

    it('should handle concurrent measurements', () => {
      const operations = Array.from({ length: 20 }).map(
        (_, i) =>
          new Promise<void>((resolve) => {
            PerformanceProfiler.startMeasure(`concurrent_${i}`);
            setTimeout(() => {
              PerformanceProfiler.endMeasure(`concurrent_${i}`);
              resolve();
            }, Math.random() * 50);
          }),
      );

      return Promise.all(operations).then(() => {
        const allStats = PerformanceProfiler.getAllStats();
        expect(allStats.length).toBeGreaterThan(0);

        // Verify all operations were measured
        for (let i = 0; i < 20; i++) {
          const stat = allStats.find((s: PerformanceStats) => s.metric === `concurrent_${i}`);
          expect(stat).toBeDefined();
        }
      });
    });
  });

  describe('Bottleneck Identification', () => {
    it('should identify slow operations', () => {
      // Fast operations
      for (let i = 0; i < 5; i++) {
        PerformanceProfiler.startMeasure('fast_operation');
        for (let j = 0; j < 10; j++) {
          Math.sqrt(j);
        }
        PerformanceProfiler.endMeasure('fast_operation');
      }

      // Slow operations
      for (let i = 0; i < 5; i++) {
        PerformanceProfiler.startMeasure('slow_operation');
        for (let j = 0; j < 10000; j++) {
          Math.sqrt(j);
        }
        PerformanceProfiler.endMeasure('slow_operation');
      }

      const fastStats = PerformanceProfiler.getStats('fast_operation');
      const slowStats = PerformanceProfiler.getStats('slow_operation');

      expect(fastStats).toBeDefined();
      expect(slowStats).toBeDefined();
      expect(slowStats!.averageTime).toBeGreaterThan(fastStats!.averageTime);
    });

    it('should identify memory-intensive operations', () => {
      PerformanceProfiler.startMeasure('memory_intensive');

      // Create large data structures
      const largeArray = Array.from({ length: 10000 }).map((_, i) => ({
        id: i,
        data: Array.from({ length: 100 }).map((_, j) => `value_${j}`),
      }));

      const memoryUsage = JSON.stringify(largeArray).length;

      PerformanceProfiler.endMeasure('memory_intensive');

      const stats = PerformanceProfiler.getStats('memory_intensive');
      expect(stats).toBeDefined();
      expect(memoryUsage).toBeGreaterThan(1000000); // > 1MB
    });
  });
});
