/**
 * MCP Server Registry
 * Central registry for all available MCP server implementations
 */

import GitHubMCPServer, { GitHubConfig } from './servers/github-mcp';
import SlackMCPServer, { SlackConfig } from './servers/slack-mcp';
import NotionMCPServer, { NotionConfig } from './servers/notion-mcp';
import { MCPServerConfig } from './mcp-server-manager';

export type ServerType = 'github' | 'slack' | 'notion';

export interface ServerDefinition {
  id: ServerType;
  name: string;
  description: string;
  icon: string;
  docs: string;
  requiredScopes?: string[];
  authMethod: 'bearer' | 'api-key' | 'basic';
}

export class MCPServerRegistry {
  private static servers: Map<ServerType, ServerDefinition> = new Map([
    [
      'github',
      {
        id: 'github',
        name: 'GitHub',
        description: 'Access GitHub repositories, issues, pull requests, and more',
        icon: 'github',
        docs: 'https://docs.github.com/en/rest',
        authMethod: 'bearer',
        requiredScopes: ['repo', 'user', 'gist'],
      },
    ],
    [
      'slack',
      {
        id: 'slack',
        name: 'Slack',
        description: 'Send messages, manage channels, and interact with Slack workspace',
        icon: 'slack',
        docs: 'https://api.slack.com',
        authMethod: 'bearer',
        requiredScopes: ['chat:write', 'channels:read', 'users:read'],
      },
    ],
    [
      'notion',
      {
        id: 'notion',
        name: 'Notion',
        description: 'Query databases, create pages, and manage Notion workspace',
        icon: 'notion',
        docs: 'https://developers.notion.com',
        authMethod: 'bearer',
        requiredScopes: [],
      },
    ],
  ]);

  /**
   * Get server definition by type
   */
  static getServerDefinition(type: ServerType): ServerDefinition | null {
    return this.servers.get(type) || null;
  }

  /**
   * Get all available server definitions
   */
  static getAllServers(): ServerDefinition[] {
    return Array.from(this.servers.values());
  }

  /**
   * Create MCP server configuration from server type and token
   */
  static createServerConfig(type: ServerType, token: string): MCPServerConfig | null {
    switch (type) {
      case 'github': {
        const github = new GitHubMCPServer({ token });
        return github.getMCPConfig();
      }
      case 'slack': {
        const slack = new SlackMCPServer({ token });
        return slack.getMCPConfig();
      }
      case 'notion': {
        const notion = new NotionMCPServer({ token });
        return notion.getMCPConfig();
      }
      default:
        return null;
    }
  }

  /**
   * Get available tools for a server type
   */
  static getServerTools(type: ServerType): any[] {
    switch (type) {
      case 'github': {
        const github = new GitHubMCPServer({ token: '' });
        return github.getAvailableTools();
      }
      case 'slack': {
        const slack = new SlackMCPServer({ token: '' });
        return slack.getAvailableTools();
      }
      case 'notion': {
        const notion = new NotionMCPServer({ token: '' });
        return notion.getAvailableTools();
      }
      default:
        return [];
    }
  }

  /**
   * Validate token for a server type
   */
  static async validateToken(type: ServerType, token: string): Promise<boolean> {
    switch (type) {
      case 'github': {
        const github = new GitHubMCPServer({ token });
        return github.validateToken();
      }
      case 'slack': {
        const slack = new SlackMCPServer({ token });
        return slack.validateToken();
      }
      case 'notion': {
        const notion = new NotionMCPServer({ token });
        return notion.validateToken();
      }
      default:
        return false;
    }
  }
}

export default MCPServerRegistry;
