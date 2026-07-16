/**
 * GitHub MCP Server Implementation
 * Provides access to GitHub API through MCP interface
 */

import { MCPServerConfig } from '../mcp-server-manager';

export interface GitHubConfig {
  token: string;
  baseUrl?: string;
}

export class GitHubMCPServer {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = {
      baseUrl: 'https://api.github.com',
      ...config,
    };
  }

  /**
   * Get MCP server configuration for GitHub
   */
  getMCPConfig(): MCPServerConfig {
    return {
      id: 'github-mcp',
      name: 'GitHub',
      url: `${this.config.baseUrl}/mcp`,
      type: 'http',
      auth: {
        type: 'bearer',
        token: this.config.token,
      },
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 30000,
    };
  }

  /**
   * Get available GitHub tools
   */
  getAvailableTools() {
    return [
      {
        name: 'list_repositories',
        description: 'List repositories for the authenticated user or organization',
        inputSchema: {
          type: 'object',
          properties: {
            org: { type: 'string', description: 'Organization name (optional)' },
            per_page: { type: 'number', description: 'Items per page (default: 30)' },
            page: { type: 'number', description: 'Page number (default: 1)' },
          },
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'Issue title' },
            body: { type: 'string', description: 'Issue description' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Labels' },
            assignees: { type: 'array', items: { type: 'string' }, description: 'Assignees' },
          },
          required: ['owner', 'repo', 'title'],
        },
      },
      {
        name: 'create_pull_request',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            title: { type: 'string', description: 'PR title' },
            body: { type: 'string', description: 'PR description' },
            head: { type: 'string', description: 'Head branch' },
            base: { type: 'string', description: 'Base branch' },
          },
          required: ['owner', 'repo', 'title', 'head', 'base'],
        },
      },
      {
        name: 'list_issues',
        description: 'List issues in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            state: { type: 'string', enum: ['open', 'closed', 'all'], description: 'Issue state' },
            per_page: { type: 'number', description: 'Items per page' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'get_user_profile',
        description: 'Get authenticated user profile information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'search_repositories',
        description: 'Search for repositories',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            sort: { type: 'string', enum: ['stars', 'forks', 'updated'], description: 'Sort by' },
            per_page: { type: 'number', description: 'Items per page' },
          },
          required: ['query'],
        },
      },
      {
        name: 'add_repository_label',
        description: 'Add a label to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            issue_number: { type: 'number', description: 'Issue number' },
            labels: { type: 'array', items: { type: 'string' }, description: 'Labels to add' },
          },
          required: ['owner', 'repo', 'issue_number', 'labels'],
        },
      },
      {
        name: 'create_repository',
        description: 'Create a new repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Repository name' },
            description: { type: 'string', description: 'Repository description' },
            private: { type: 'boolean', description: 'Make repository private' },
            auto_init: { type: 'boolean', description: 'Initialize with README' },
          },
          required: ['name'],
        },
      },
    ];
  }

  /**
   * Validate GitHub token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/user`, {
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default GitHubMCPServer;
