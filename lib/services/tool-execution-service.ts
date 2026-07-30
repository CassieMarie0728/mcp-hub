import { z } from 'zod';

/**
 * Tool Execution Service
 * Handles tool discovery, execution, and result management
 */

// ============================================================================
// Types & Schemas
// ============================================================================

export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export interface ToolParameter {
  name: string;
  type: ParameterType;
  description?: string;
  required: boolean;
  default?: any;
  enum?: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface ToolSchema {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  parameters: ToolParameter[];
  inputSchema?: ToolSchema;
  category?: string;
  tags?: string[];
  createdAt: number;
}

export interface ToolExecutionRequest {
  toolId: string;
  serverId: string;
  parameters: Record<string, any>;
  timeout?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: number;
  executionId: string;
}

export interface ToolExecutionHistory {
  id: string;
  toolId: string;
  serverId: string;
  request: ToolExecutionRequest;
  result: ToolExecutionResult;
  userId?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const ParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string().optional(),
  required: z.boolean(),
  default: z.any().optional(),
  enum: z.array(z.string()).optional(),
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
});

const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  serverId: z.string(),
  parameters: z.array(ParameterSchema),
  inputSchema: z.any().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.number(),
});

// ============================================================================
// Tool Execution Service
// ============================================================================

export class ToolExecutionService {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private executionHistory: ToolExecutionHistory[] = [];

  /**
   * Discover tools from a server
   */
  static async discoverTools(
    serverUrl: string,
    serverId: string,
    credentials?: any
  ): Promise<{ success: boolean; tools?: Tool[]; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth headers if provided
      if (credentials) {
        // Implementation would add credentials here
      }

      const response = await fetch(`${serverUrl}/mcp/tools/list`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to discover tools: ${response.status}`,
        };
      }

      const data = await response.json();
      const tools: Tool[] = (data.tools || []).map((tool: any, index: number) => ({
        id: `${serverId}-tool-${index}`,
        name: tool.name,
        description: tool.description || '',
        serverId,
        parameters: this.parseParameters(tool.inputSchema),
        inputSchema: tool.inputSchema,
        category: tool.category,
        tags: tool.tags,
        createdAt: Date.now(),
      }));

      return { success: true, tools };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover tools',
      };
    }
  }

  /**
   * Parse parameters from JSON schema
   */
  private static parseParameters(schema?: any): ToolParameter[] {
    if (!schema || !schema.properties) {
      return [];
    }

    const required = schema.required || [];
    const parameters: ToolParameter[] = [];

    for (const [name, prop] of Object.entries(schema.properties)) {
      const propSchema = prop as any;
      parameters.push({
        name,
        type: propSchema.type || 'string',
        description: propSchema.description,
        required: required.includes(name),
        default: propSchema.default,
        enum: propSchema.enum,
        pattern: propSchema.pattern,
        minLength: propSchema.minLength,
        maxLength: propSchema.maxLength,
        minimum: propSchema.minimum,
        maximum: propSchema.maximum,
      });
    }

    return parameters;
  }

  /**
   * Validate tool parameters
   */
  static validateParameters(
    tool: Tool,
    parameters: Record<string, any>
  ): { valid: boolean; errors?: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const param of tool.parameters) {
      const value = parameters[param.name];

      // Check required
      if (param.required && (value === undefined || value === null || value === '')) {
        errors[param.name] = `${param.name} is required`;
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== param.type) {
        errors[param.name] = `${param.name} must be of type ${param.type}`;
        continue;
      }

      // String validations
      if (param.type === 'string' && typeof value === 'string') {
        if (param.minLength && value.length < param.minLength) {
          errors[param.name] = `${param.name} must be at least ${param.minLength} characters`;
        }
        if (param.maxLength && value.length > param.maxLength) {
          errors[param.name] = `${param.name} must be at most ${param.maxLength} characters`;
        }
        if (param.pattern && !new RegExp(param.pattern).test(value)) {
          errors[param.name] = `${param.name} format is invalid`;
        }
        if (param.enum && !param.enum.includes(value)) {
          errors[param.name] = `${param.name} must be one of: ${param.enum.join(', ')}`;
        }
      }

      // Number validations
      if (param.type === 'number' && typeof value === 'number') {
        if (param.minimum !== undefined && value < param.minimum) {
          errors[param.name] = `${param.name} must be at least ${param.minimum}`;
        }
        if (param.maximum !== undefined && value > param.maximum) {
          errors[param.name] = `${param.name} must be at most ${param.maximum}`;
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  /**
   * Execute a tool
   */
  static async executeTool(
    serverUrl: string,
    request: ToolExecutionRequest
  ): Promise<ToolExecutionResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = request.timeout || this.DEFAULT_TIMEOUT;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${serverUrl}/mcp/tools/call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: request.toolId,
            arguments: request.parameters,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          return {
            success: false,
            error: `Tool execution failed: ${response.status}`,
            duration,
            timestamp: Date.now(),
            executionId,
          };
        }

        const result = await response.json();
        return {
          success: true,
          data: result,
          duration,
          timestamp: Date.now(),
          executionId,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        duration,
        timestamp: Date.now(),
        executionId,
      };
    }
  }

  /**
   * Format tool result for display
   */
  static formatResult(result: ToolExecutionResult): string {
    if (!result.success) {
      return `Error: ${result.error}`;
    }

    if (typeof result.data === 'string') {
      return result.data;
    }

    if (typeof result.data === 'object') {
      return JSON.stringify(result.data, null, 2);
    }

    return String(result.data);
  }

  /**
   * Get tool by ID
   */
  static async getTool(
    tools: Tool[],
    toolId: string
  ): Promise<Tool | undefined> {
    return tools.find((t) => t.id === toolId);
  }

  /**
   * Search tools
   */
  static searchTools(tools: Tool[], query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        (tool.tags || []).some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Filter tools by category
   */
  static filterToolsByCategory(tools: Tool[], category: string): Tool[] {
    return tools.filter((tool) => tool.category === category);
  }

  /**
   * Get unique categories from tools
   */
  static getCategories(tools: Tool[]): string[] {
    const categories = new Set<string>();
    for (const tool of tools) {
      if (tool.category) {
        categories.add(tool.category);
      }
    }
    return Array.from(categories).sort();
  }
}

export default ToolExecutionService;
