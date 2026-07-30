import { describe, it, expect, beforeEach, vi } from 'vitest';
import ToolExecutionService, { Tool, ToolParameter } from '../services/tool-execution-service';

describe('ToolExecutionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Parameter Validation Tests
  // ========================================================================

  describe('validateParameters', () => {
    const createTool = (parameters: ToolParameter[]): Tool => ({
      id: 'tool-1',
      name: 'Test Tool',
      description: 'Test',
      serverId: 'server-1',
      parameters,
      createdAt: Date.now(),
    });

    it('should validate required parameters', () => {
      const tool = createTool([
        {
          name: 'query',
          type: 'string',
          required: true,
        },
      ]);

      const result = ToolExecutionService.validateParameters(tool, { query: 'test' });
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject missing required parameters', () => {
      const tool = createTool([
        {
          name: 'query',
          type: 'string',
          required: true,
        },
      ]);

      const result = ToolExecutionService.validateParameters(tool, {});
      expect(result.valid).toBe(false);
      expect(result.errors?.query).toContain('required');
    });

    it('should allow optional parameters to be missing', () => {
      const tool = createTool([
        {
          name: 'filter',
          type: 'string',
          required: false,
        },
      ]);

      const result = ToolExecutionService.validateParameters(tool, {});
      expect(result.valid).toBe(true);
    });

    it('should validate parameter types', () => {
      const tool = createTool([
        {
          name: 'count',
          type: 'number',
          required: true,
        },
      ]);

      const result = ToolExecutionService.validateParameters(tool, { count: 'not-a-number' });
      expect(result.valid).toBe(false);
      expect(result.errors?.count).toContain('type');
    });

    it('should validate string length', () => {
      const tool = createTool([
        {
          name: 'username',
          type: 'string',
          required: true,
          minLength: 3,
          maxLength: 10,
        },
      ]);

      const tooShort = ToolExecutionService.validateParameters(tool, { username: 'ab' });
      expect(tooShort.valid).toBe(false);

      const tooLong = ToolExecutionService.validateParameters(tool, { username: 'abcdefghijk' });
      expect(tooLong.valid).toBe(false);

      const valid = ToolExecutionService.validateParameters(tool, { username: 'abcde' });
      expect(valid.valid).toBe(true);
    });

    it('should validate number range', () => {
      const tool = createTool([
        {
          name: 'age',
          type: 'number',
          required: true,
          minimum: 0,
          maximum: 150,
        },
      ]);

      const tooSmall = ToolExecutionService.validateParameters(tool, { age: -1 });
      expect(tooSmall.valid).toBe(false);

      const tooLarge = ToolExecutionService.validateParameters(tool, { age: 200 });
      expect(tooLarge.valid).toBe(false);

      const valid = ToolExecutionService.validateParameters(tool, { age: 25 });
      expect(valid.valid).toBe(true);
    });

    it('should validate enum values', () => {
      const tool = createTool([
        {
          name: 'status',
          type: 'string',
          required: true,
          enum: ['active', 'inactive', 'pending'],
        },
      ]);

      const invalid = ToolExecutionService.validateParameters(tool, { status: 'unknown' });
      expect(invalid.valid).toBe(false);

      const valid = ToolExecutionService.validateParameters(tool, { status: 'active' });
      expect(valid.valid).toBe(true);
    });

    it('should validate regex pattern', () => {
      const tool = createTool([
        {
          name: 'email',
          type: 'string',
          required: true,
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
        },
      ]);

      const invalid = ToolExecutionService.validateParameters(tool, { email: 'not-an-email' });
      expect(invalid.valid).toBe(false);

      const valid = ToolExecutionService.validateParameters(tool, { email: 'test@example.com' });
      expect(valid.valid).toBe(true);
    });

    it('should validate multiple parameters', () => {
      const tool = createTool([
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: true, minimum: 0 },
        { name: 'email', type: 'string', required: false },
      ]);

      const result = ToolExecutionService.validateParameters(tool, {
        name: 'John',
        age: 30,
      });
      expect(result.valid).toBe(true);
    });
  });

  // ========================================================================
  // Tool Search & Filter Tests
  // ========================================================================

  describe('searchTools', () => {
    const tools: Tool[] = [
      {
        id: 'tool-1',
        name: 'Get User',
        description: 'Retrieve user information',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        tags: ['user', 'profile'],
        createdAt: Date.now(),
      },
      {
        id: 'tool-2',
        name: 'Send Email',
        description: 'Send an email message',
        serverId: 'server-1',
        parameters: [],
        category: 'communication',
        tags: ['email', 'notification'],
        createdAt: Date.now(),
      },
      {
        id: 'tool-3',
        name: 'Delete User',
        description: 'Remove a user account',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        tags: ['user', 'admin'],
        createdAt: Date.now(),
      },
    ];

    it('should search by tool name', () => {
      const results = ToolExecutionService.searchTools(tools, 'user');
      expect(results.length).toBe(2);
      expect(results[0].name).toContain('User');
    });

    it('should search by description', () => {
      const results = ToolExecutionService.searchTools(tools, 'email');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Send Email');
    });

    it('should search by tags', () => {
      const results = ToolExecutionService.searchTools(tools, 'admin');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Delete User');
    });

    it('should be case-insensitive', () => {
      const results = ToolExecutionService.searchTools(tools, 'USER');
      expect(results.length).toBe(2);
    });

    it('should return empty array for no matches', () => {
      const results = ToolExecutionService.searchTools(tools, 'nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('filterToolsByCategory', () => {
    const tools: Tool[] = [
      {
        id: 'tool-1',
        name: 'Get User',
        description: 'Retrieve user',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        createdAt: Date.now(),
      },
      {
        id: 'tool-2',
        name: 'Send Email',
        description: 'Send email',
        serverId: 'server-1',
        parameters: [],
        category: 'communication',
        createdAt: Date.now(),
      },
      {
        id: 'tool-3',
        name: 'Delete User',
        description: 'Delete user',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        createdAt: Date.now(),
      },
    ];

    it('should filter tools by category', () => {
      const results = ToolExecutionService.filterToolsByCategory(tools, 'users');
      expect(results.length).toBe(2);
      expect(results.every((t) => t.category === 'users')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const results = ToolExecutionService.filterToolsByCategory(tools, 'nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('getCategories', () => {
    const tools: Tool[] = [
      {
        id: 'tool-1',
        name: 'Get User',
        description: 'Retrieve user',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        createdAt: Date.now(),
      },
      {
        id: 'tool-2',
        name: 'Send Email',
        description: 'Send email',
        serverId: 'server-1',
        parameters: [],
        category: 'communication',
        createdAt: Date.now(),
      },
      {
        id: 'tool-3',
        name: 'Delete User',
        description: 'Delete user',
        serverId: 'server-1',
        parameters: [],
        category: 'users',
        createdAt: Date.now(),
      },
    ];

    it('should get unique categories', () => {
      const categories = ToolExecutionService.getCategories(tools);
      expect(categories.length).toBe(2);
      expect(categories).toContain('users');
      expect(categories).toContain('communication');
    });

    it('should return sorted categories', () => {
      const categories = ToolExecutionService.getCategories(tools);
      expect(categories).toEqual([...categories].sort());
    });

    it('should handle tools without categories', () => {
      const toolsWithoutCat: Tool[] = [
        {
          id: 'tool-1',
          name: 'Test',
          description: 'Test',
          serverId: 'server-1',
          parameters: [],
          createdAt: Date.now(),
        },
      ];
      const categories = ToolExecutionService.getCategories(toolsWithoutCat);
      expect(categories.length).toBe(0);
    });
  });

  // ========================================================================
  // Result Formatting Tests
  // ========================================================================

  describe('formatResult', () => {
    it('should format error result', () => {
      const result = ToolExecutionService.formatResult({
        success: false,
        error: 'Connection failed',
        duration: 100,
        timestamp: Date.now(),
        executionId: 'exec-1',
      });
      expect(result).toContain('Error');
      expect(result).toContain('Connection failed');
    });

    it('should format string result', () => {
      const result = ToolExecutionService.formatResult({
        success: true,
        data: 'Success message',
        duration: 100,
        timestamp: Date.now(),
        executionId: 'exec-1',
      });
      expect(result).toBe('Success message');
    });

    it('should format object result as JSON', () => {
      const data = { id: 1, name: 'Test' };
      const result = ToolExecutionService.formatResult({
        success: true,
        data,
        duration: 100,
        timestamp: Date.now(),
        executionId: 'exec-1',
      });
      expect(result).toContain('id');
      expect(result).toContain('Test');
    });

    it('should format number result', () => {
      const result = ToolExecutionService.formatResult({
        success: true,
        data: 42,
        duration: 100,
        timestamp: Date.now(),
        executionId: 'exec-1',
      });
      expect(result).toBe('42');
    });
  });

  // ========================================================================
  // Tool Retrieval Tests
  // ========================================================================

  describe('getTool', () => {
    const tools: Tool[] = [
      {
        id: 'tool-1',
        name: 'Tool 1',
        description: 'Test',
        serverId: 'server-1',
        parameters: [],
        createdAt: Date.now(),
      },
      {
        id: 'tool-2',
        name: 'Tool 2',
        description: 'Test',
        serverId: 'server-1',
        parameters: [],
        createdAt: Date.now(),
      },
    ];

    it('should retrieve tool by ID', async () => {
      const tool = await ToolExecutionService.getTool(tools, 'tool-1');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('Tool 1');
    });

    it('should return undefined for non-existent tool', async () => {
      const tool = await ToolExecutionService.getTool(tools, 'nonexistent');
      expect(tool).toBeUndefined();
    });
  });
});
