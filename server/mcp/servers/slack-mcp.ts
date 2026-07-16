/**
 * Slack MCP Server Implementation
 * Provides access to Slack API through MCP interface
 */

import { MCPServerConfig } from '../mcp-server-manager';

export interface SlackConfig {
  token: string;
  baseUrl?: string;
}

export class SlackMCPServer {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = {
      baseUrl: 'https://slack.com/api',
      ...config,
    };
  }

  /**
   * Get MCP server configuration for Slack
   */
  getMCPConfig(): MCPServerConfig {
    return {
      id: 'slack-mcp',
      name: 'Slack',
      url: `${this.config.baseUrl}/mcp`,
      type: 'http',
      auth: {
        type: 'bearer',
        token: this.config.token,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
  }

  /**
   * Get available Slack tools
   */
  getAvailableTools() {
    return [
      {
        name: 'send_message',
        description: 'Send a message to a Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID or name' },
            text: { type: 'string', description: 'Message text' },
            thread_ts: { type: 'string', description: 'Thread timestamp (optional)' },
            blocks: { type: 'array', description: 'Block Kit blocks (optional)' },
          },
          required: ['channel', 'text'],
        },
      },
      {
        name: 'list_channels',
        description: 'List all channels in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            exclude_archived: { type: 'boolean', description: 'Exclude archived channels' },
            limit: { type: 'number', description: 'Maximum channels to return' },
          },
        },
      },
      {
        name: 'get_channel_info',
        description: 'Get information about a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
          },
          required: ['channel'],
        },
      },
      {
        name: 'list_users',
        description: 'List all users in the workspace',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum users to return' },
          },
        },
      },
      {
        name: 'get_user_info',
        description: 'Get information about a user',
        inputSchema: {
          type: 'object',
          properties: {
            user: { type: 'string', description: 'User ID' },
          },
          required: ['user'],
        },
      },
      {
        name: 'create_channel',
        description: 'Create a new channel',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Channel name' },
            is_private: { type: 'boolean', description: 'Make channel private' },
            description: { type: 'string', description: 'Channel description' },
          },
          required: ['name'],
        },
      },
      {
        name: 'add_reaction',
        description: 'Add an emoji reaction to a message',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            timestamp: { type: 'string', description: 'Message timestamp' },
            name: { type: 'string', description: 'Emoji name (without colons)' },
          },
          required: ['channel', 'timestamp', 'name'],
        },
      },
      {
        name: 'set_topic',
        description: 'Set the topic for a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            topic: { type: 'string', description: 'New topic' },
          },
          required: ['channel', 'topic'],
        },
      },
      {
        name: 'invite_users',
        description: 'Invite users to a channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            users: { type: 'array', items: { type: 'string' }, description: 'User IDs' },
          },
          required: ['channel', 'users'],
        },
      },
      {
        name: 'get_auth_test',
        description: 'Test authentication and get workspace info',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Validate Slack token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth.test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = (await response.json()) as { ok?: boolean };
      return data.ok === true;
    } catch {
      return false;
    }
  }
}

export default SlackMCPServer;
