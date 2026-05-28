/**
 * Notion MCP Server Implementation
 * Provides access to Notion API through MCP interface
 */

import { MCPServerConfig } from '../mcp-server-manager';

export interface NotionConfig {
  token: string;
  baseUrl?: string;
}

export class NotionMCPServer {
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.config = {
      baseUrl: 'https://api.notion.com/v1',
      ...config,
    };
  }

  /**
   * Get MCP server configuration for Notion
   */
  getMCPConfig(): MCPServerConfig {
    return {
      id: 'notion-mcp',
      name: 'Notion',
      url: `${this.config.baseUrl}/mcp`,
      type: 'http',
      auth: {
        type: 'bearer',
        token: this.config.token,
      },
      headers: {
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Get available Notion tools
   */
  getAvailableTools() {
    return [
      {
        name: 'query_database',
        description: 'Query a Notion database',
        inputSchema: {
          type: 'object',
          properties: {
            database_id: { type: 'string', description: 'Database ID' },
            filter: { type: 'object', description: 'Filter conditions' },
            sorts: { type: 'array', description: 'Sort order' },
            page_size: { type: 'number', description: 'Items per page' },
          },
          required: ['database_id'],
        },
      },
      {
        name: 'create_page',
        description: 'Create a new page in a database',
        inputSchema: {
          type: 'object',
          properties: {
            parent: { type: 'object', description: 'Parent database or page' },
            properties: { type: 'object', description: 'Page properties' },
            children: { type: 'array', description: 'Page content blocks' },
          },
          required: ['parent', 'properties'],
        },
      },
      {
        name: 'update_page',
        description: 'Update an existing page',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: { type: 'string', description: 'Page ID' },
            properties: { type: 'object', description: 'Properties to update' },
            archived: { type: 'boolean', description: 'Archive the page' },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'get_page',
        description: 'Get page details',
        inputSchema: {
          type: 'object',
          properties: {
            page_id: { type: 'string', description: 'Page ID' },
          },
          required: ['page_id'],
        },
      },
      {
        name: 'get_database',
        description: 'Get database schema',
        inputSchema: {
          type: 'object',
          properties: {
            database_id: { type: 'string', description: 'Database ID' },
          },
          required: ['database_id'],
        },
      },
      {
        name: 'append_block_children',
        description: 'Add blocks to a page',
        inputSchema: {
          type: 'object',
          properties: {
            block_id: { type: 'string', description: 'Block ID (usually page ID)' },
            children: { type: 'array', description: 'Blocks to append' },
          },
          required: ['block_id', 'children'],
        },
      },
      {
        name: 'search',
        description: 'Search for pages and databases',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            filter: { type: 'object', description: 'Filter by type' },
            sort: { type: 'object', description: 'Sort order' },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_database',
        description: 'Create a new database',
        inputSchema: {
          type: 'object',
          properties: {
            parent: { type: 'object', description: 'Parent page' },
            title: { type: 'array', description: 'Database title' },
            properties: { type: 'object', description: 'Database properties/columns' },
          },
          required: ['parent', 'title', 'properties'],
        },
      },
      {
        name: 'retrieve_block_children',
        description: 'Get child blocks of a page',
        inputSchema: {
          type: 'object',
          properties: {
            block_id: { type: 'string', description: 'Block ID' },
            page_size: { type: 'number', description: 'Items per page' },
          },
          required: ['block_id'],
        },
      },
      {
        name: 'delete_block',
        description: 'Delete a block',
        inputSchema: {
          type: 'object',
          properties: {
            block_id: { type: 'string', description: 'Block ID' },
          },
          required: ['block_id'],
        },
      },
    ];
  }

  /**
   * Validate Notion token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/users/me`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Notion-Version': '2022-06-28',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default NotionMCPServer;
