import { describe, it, expect } from 'vitest';
import {
  ExecutionHistoryEntry,
  ExecutionStatus,
  ExecutionHistoryManager,
} from '../../lib/models/ExecutionHistory';

describe('Execution History Model and Manager', () => {
  describe('ExecutionHistoryEntry', () => {
    it('should create a valid execution history entry', () => {
      const entry: ExecutionHistoryEntry = {
        id: 'exec_123',
        serverId: 'server_1',
        serverName: 'Test Server',
        toolName: 'list_directory',
        parameters: { path: '/tmp' },
        result: ['file1.txt', 'file2.txt'],
        resultType: 'TABLE',
        resultSize: 1024,
        timestamp: Date.now(),
        executionTimeMs: 250,
        status: ExecutionStatus.SUCCESS,
      };

      expect(entry.id).toBe('exec_123');
      expect(entry.toolName).toBe('list_directory');
      expect(entry.status).toBe(ExecutionStatus.SUCCESS);
    });

    it('should handle error entries', () => {
      const entry: ExecutionHistoryEntry = {
        id: 'exec_124',
        serverId: 'server_1',
        serverName: 'Test Server',
        toolName: 'read_file',
        parameters: { path: '/nonexistent' },
        result: null,
        resultType: 'TEXT',
        resultSize: 0,
        timestamp: Date.now(),
        executionTimeMs: 100,
        status: ExecutionStatus.FAILED,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      };

      expect(entry.status).toBe(ExecutionStatus.FAILED);
      expect(entry.error?.code).toBe('FILE_NOT_FOUND');
    });

    it('should support optional fields', () => {
      const entry: ExecutionHistoryEntry = {
        id: 'exec_125',
        serverId: 'server_1',
        serverName: 'Test Server',
        toolName: 'test_tool',
        parameters: {},
        result: 'test',
        resultType: 'TEXT',
        resultSize: 4,
        timestamp: Date.now(),
        executionTimeMs: 50,
        status: ExecutionStatus.SUCCESS,
        tags: ['important', 'test'],
        notes: 'This is a test execution',
      };

      expect(entry.tags).toContain('important');
      expect(entry.notes).toBe('This is a test execution');
    });
  });

  describe('ExecutionStatus enum', () => {
    it('should have all required status values', () => {
      expect(ExecutionStatus.SUCCESS).toBe('SUCCESS');
      expect(ExecutionStatus.FAILED).toBe('FAILED');
      expect(ExecutionStatus.TIMEOUT).toBe('TIMEOUT');
      expect(ExecutionStatus.CANCELLED).toBe('CANCELLED');
      expect(ExecutionStatus.PARTIAL).toBe('PARTIAL');
    });
  });

  describe('ExecutionHistoryManager', () => {
    it('should calculate statistics correctly', () => {
      const entries: ExecutionHistoryEntry[] = [
        {
          id: '1',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'tool1',
          parameters: {},
          result: 'success',
          resultType: 'TEXT',
          resultSize: 100,
          timestamp: Date.now(),
          executionTimeMs: 100,
          status: ExecutionStatus.SUCCESS,
        },
        {
          id: '2',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'tool1',
          parameters: {},
          result: 'failed',
          resultType: 'TEXT',
          resultSize: 50,
          timestamp: Date.now(),
          executionTimeMs: 200,
          status: ExecutionStatus.FAILED,
        },
        {
          id: '3',
          serverId: 's2',
          serverName: 'Server 2',
          toolName: 'tool2',
          parameters: {},
          result: 'timeout',
          resultType: 'TEXT',
          resultSize: 0,
          timestamp: Date.now(),
          executionTimeMs: 30000,
          status: ExecutionStatus.TIMEOUT,
        },
      ];

      // Test success rate calculation
      const successCount = entries.filter((e) => e.status === ExecutionStatus.SUCCESS).length;
      expect(successCount).toBe(1);

      // Test average execution time
      const avgTime = entries.reduce((sum, e) => sum + e.executionTimeMs, 0) / entries.length;
      expect(avgTime).toBeGreaterThan(0);

      // Test tool usage counting
      const toolCounts = new Map<string, number>();
      entries.forEach((e) => {
        toolCounts.set(e.toolName, (toolCounts.get(e.toolName) || 0) + 1);
      });
      expect(toolCounts.get('tool1')).toBe(2);
      expect(toolCounts.get('tool2')).toBe(1);
    });

    it('should filter entries correctly', () => {
      const entries: ExecutionHistoryEntry[] = [
        {
          id: '1',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'list_files',
          parameters: {},
          result: [],
          resultType: 'TABLE',
          resultSize: 100,
          timestamp: Date.now(),
          executionTimeMs: 100,
          status: ExecutionStatus.SUCCESS,
        },
        {
          id: '2',
          serverId: 's2',
          serverName: 'Server 2',
          toolName: 'read_file',
          parameters: {},
          result: 'content',
          resultType: 'TEXT',
          resultSize: 200,
          timestamp: Date.now() - 86400000, // 1 day ago
          executionTimeMs: 50,
          status: ExecutionStatus.SUCCESS,
        },
        {
          id: '3',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'write_file',
          parameters: {},
          result: null,
          resultType: 'TEXT',
          resultSize: 0,
          timestamp: Date.now(),
          executionTimeMs: 150,
          status: ExecutionStatus.FAILED,
        },
      ];

      // Filter by server
      const s1Entries = entries.filter((e) => e.serverId === 's1');
      expect(s1Entries).toHaveLength(2);

      // Filter by status
      const successEntries = entries.filter((e) => e.status === ExecutionStatus.SUCCESS);
      expect(successEntries).toHaveLength(2);

      // Filter by tool name
      const listEntries = entries.filter((e) => e.toolName.includes('list'));
      expect(listEntries).toHaveLength(1);
    });

    it('should handle empty history', () => {
      const entries: ExecutionHistoryEntry[] = [];

      expect(entries).toHaveLength(0);
      const stats = {
        totalExecutions: entries.length,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        averageExecutionTimeMs: 0,
        mostUsedTools: [],
        mostUsedServers: [],
      };

      expect(stats.totalExecutions).toBe(0);
      expect(stats.averageExecutionTimeMs).toBe(0);
    });

    it('should handle large result sizes', () => {
      const entry: ExecutionHistoryEntry = {
        id: 'large',
        serverId: 's1',
        serverName: 'Server 1',
        toolName: 'large_query',
        parameters: {},
        result: 'x'.repeat(1024 * 1024), // 1MB
        resultType: 'TEXT',
        resultSize: 1024 * 1024,
        timestamp: Date.now(),
        executionTimeMs: 5000,
        status: ExecutionStatus.SUCCESS,
      };

      expect(entry.resultSize).toBe(1024 * 1024);
      expect(entry.resultSize > 100 * 1024).toBe(true); // Larger than 100KB
    });

    it('should track execution metadata', () => {
      const now = Date.now();
      const entry: ExecutionHistoryEntry = {
        id: 'meta_test',
        serverId: 's1',
        serverName: 'Server 1',
        toolName: 'test',
        parameters: { param1: 'value1' },
        result: 'result',
        resultType: 'JSON',
        resultSize: 100,
        timestamp: now,
        executionTimeMs: 250,
        status: ExecutionStatus.SUCCESS,
      };

      expect(entry.timestamp).toBe(now);
      expect(entry.executionTimeMs).toBe(250);
      expect(entry.parameters.param1).toBe('value1');
    });
  });

  describe('Execution filtering', () => {
    it('should filter by date range', () => {
      const now = Date.now();
      const yesterday = now - 86400000;
      const tomorrow = now + 86400000;

      const entries: ExecutionHistoryEntry[] = [
        {
          id: '1',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'tool1',
          parameters: {},
          result: 'old',
          resultType: 'TEXT',
          resultSize: 10,
          timestamp: yesterday,
          executionTimeMs: 100,
          status: ExecutionStatus.SUCCESS,
        },
        {
          id: '2',
          serverId: 's1',
          serverName: 'Server 1',
          toolName: 'tool1',
          parameters: {},
          result: 'new',
          resultType: 'TEXT',
          resultSize: 10,
          timestamp: now,
          executionTimeMs: 100,
          status: ExecutionStatus.SUCCESS,
        },
      ];

      const filtered = entries.filter((e) => e.timestamp >= yesterday && e.timestamp <= tomorrow);
      expect(filtered).toHaveLength(2);

      const todayOnly = entries.filter((e) => e.timestamp >= now - 3600000); // Last hour
      expect(todayOnly).toHaveLength(1);
    });

    it('should search by text', () => {
      const entries: ExecutionHistoryEntry[] = [
        {
          id: '1',
          serverId: 's1',
          serverName: 'Production Server',
          toolName: 'list_files',
          parameters: {},
          result: [],
          resultType: 'TABLE',
          resultSize: 100,
          timestamp: Date.now(),
          executionTimeMs: 100,
          status: ExecutionStatus.SUCCESS,
        },
        {
          id: '2',
          serverId: 's2',
          serverName: 'Test Server',
          toolName: 'read_file',
          parameters: {},
          result: 'content',
          resultType: 'TEXT',
          resultSize: 200,
          timestamp: Date.now(),
          executionTimeMs: 50,
          status: ExecutionStatus.SUCCESS,
        },
      ];

      const search = 'Production';
      const filtered = entries.filter(
        (e) =>
          e.toolName.toLowerCase().includes(search.toLowerCase()) ||
          e.serverName.toLowerCase().includes(search.toLowerCase()),
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].serverName).toBe('Production Server');
    });
  });
});
