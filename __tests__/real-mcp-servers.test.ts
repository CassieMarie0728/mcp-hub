/**
 * Real MCP Server Integration Tests
 * Tests for GitHub, Slack, and Notion MCP server implementations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import GitHubMCPServer from '../../server/mcp/servers/github-mcp';
import SlackMCPServer from '../../server/mcp/servers/slack-mcp';
import NotionMCPServer from '../../server/mcp/servers/notion-mcp';
import MCPServerRegistry from '../../server/mcp/mcp-server-registry';

describe('Real MCP Server Implementations', () => {
  describe('GitHub MCP Server', () => {
    let github: InstanceType<typeof GitHubMCPServer>;

    beforeEach(() => {
      github = new GitHubMCPServer({ token: 'test-token' });
    });

    it('should create valid MCP config', () => {
      const config = github.getMCPConfig();
      expect(config.id).toBe('github-mcp');
      expect(config.name).toBe('GitHub');
      expect(config.type).toBe('http');
      expect(config.auth?.type).toBe('bearer');
      expect(config.auth?.token).toBe('test-token');
    });

    it('should provide available tools', () => {
      const tools = github.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t: any) => t.name === 'list_repositories')).toBe(true);
      expect(tools.some((t: any) => t.name === 'create_issue')).toBe(true);
      expect(tools.some((t: any) => t.name === 'create_pull_request')).toBe(true);
    });

    it('should have proper tool schemas', () => {
      const tools = github.getAvailableTools();
      const createIssueTool = tools.find((t: any) => t.name === 'create_issue');

      expect(createIssueTool).toBeDefined();
      expect(createIssueTool?.inputSchema.properties).toHaveProperty('owner');
      expect(createIssueTool?.inputSchema.properties).toHaveProperty('repo');
      expect(createIssueTool?.inputSchema.properties).toHaveProperty('title');
      expect(createIssueTool?.inputSchema.required).toContain('owner');
      expect(createIssueTool?.inputSchema.required).toContain('repo');
      expect(createIssueTool?.inputSchema.required).toContain('title');
    });

    it('should include proper headers in config', () => {
      const config = github.getMCPConfig();
      expect(config.headers).toHaveProperty('Accept');
      expect(config.headers).toHaveProperty('X-GitHub-Api-Version');
    });
  });

  describe('Slack MCP Server', () => {
    let slack: InstanceType<typeof SlackMCPServer>;

    beforeEach(() => {
      slack = new SlackMCPServer({ token: 'xoxb-test-token' });
    });

    it('should create valid MCP config', () => {
      const config = slack.getMCPConfig();
      expect(config.id).toBe('slack-mcp');
      expect(config.name).toBe('Slack');
      expect(config.type).toBe('http');
      expect(config.auth?.type).toBe('bearer');
      expect(config.auth?.token).toBe('xoxb-test-token');
    });

    it('should provide available tools', () => {
      const tools = slack.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t: any) => t.name === 'send_message')).toBe(true);
      expect(tools.some((t: any) => t.name === 'list_channels')).toBe(true);
      expect(tools.some((t: any) => t.name === 'get_user_info')).toBe(true);
    });

    it('should have proper tool schemas', () => {
      const tools = slack.getAvailableTools();
      const sendMessageTool = tools.find((t: any) => t.name === 'send_message');

      expect(sendMessageTool).toBeDefined();
      expect(sendMessageTool?.inputSchema.properties).toHaveProperty('channel');
      expect(sendMessageTool?.inputSchema.properties).toHaveProperty('text');
      expect(sendMessageTool?.inputSchema.required).toContain('channel');
      expect(sendMessageTool?.inputSchema.required).toContain('text');
    });

    it('should support thread messages', () => {
      const tools = slack.getAvailableTools();
      const sendMessageTool = tools.find((t: any) => t.name === 'send_message');

      expect(sendMessageTool?.inputSchema.properties).toHaveProperty('thread_ts');
    });
  });

  describe('Notion MCP Server', () => {
    let notion: InstanceType<typeof NotionMCPServer>;

    beforeEach(() => {
      notion = new NotionMCPServer({ token: 'secret_test-token' });
    });

    it('should create valid MCP config', () => {
      const config = notion.getMCPConfig();
      expect(config.id).toBe('notion-mcp');
      expect(config.name).toBe('Notion');
      expect(config.type).toBe('http');
      expect(config.auth?.type).toBe('bearer');
      expect(config.auth?.token).toBe('secret_test-token');
    });

    it('should provide available tools', () => {
      const tools = notion.getAvailableTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.some((t: any) => t.name === 'query_database')).toBe(true);
      expect(tools.some((t: any) => t.name === 'create_page')).toBe(true);
      expect(tools.some((t: any) => t.name === 'update_page')).toBe(true);
    });

    it('should have proper tool schemas', () => {
      const tools = notion.getAvailableTools();
      const queryDatabaseTool = tools.find((t: any) => t.name === 'query_database');

      expect(queryDatabaseTool).toBeDefined();
      expect(queryDatabaseTool?.inputSchema.properties).toHaveProperty('database_id');
      expect(queryDatabaseTool?.inputSchema.required).toContain('database_id');
    });

    it('should include Notion API version in headers', () => {
      const config = notion.getMCPConfig();
      expect(config.headers).toHaveProperty('Notion-Version');
      expect(config.headers?.['Notion-Version']).toBe('2022-06-28');
    });
  });

  describe('MCP Server Registry', () => {
    it('should list all available servers', () => {
      const servers = MCPServerRegistry.getAllServers();
      expect(servers.length).toBe(3);
      expect(servers.map((s: any) => s.id)).toContain('github');
      expect(servers.map((s: any) => s.id)).toContain('slack');
      expect(servers.map((s: any) => s.id)).toContain('notion');
    });

    it('should get server definition', () => {
      const github = MCPServerRegistry.getServerDefinition('github');
      expect(github).toBeDefined();
      expect(github?.name).toBe('GitHub');
      expect(github?.authMethod).toBe('bearer');
    });

    it('should create server config from type and token', () => {
      const config = MCPServerRegistry.createServerConfig('github', 'test-token');
      expect(config).toBeDefined();
      expect(config?.id).toBe('github-mcp');
      expect(config?.auth?.token).toBe('test-token');
    });

    it('should get server tools', () => {
      const tools = MCPServerRegistry.getServerTools('github');
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty('name');
      expect(tools[0]).toHaveProperty('description');
      expect(tools[0]).toHaveProperty('inputSchema');
    });

    it('should return null for invalid server type', () => {
      const config = MCPServerRegistry.createServerConfig('invalid' as any, 'token');
      expect(config).toBeNull();
    });

    it('should return empty array for invalid server tools', () => {
      const tools = MCPServerRegistry.getServerTools('invalid' as any);
      expect(tools).toEqual([]);
    });
  });

  describe('Server Tool Schemas', () => {
    it('GitHub tools should have required fields', () => {
      const tools = MCPServerRegistry.getServerTools('github');
      const createIssue = tools.find((t: any) => t.name === 'create_issue');

      expect(createIssue?.inputSchema.required).toContain('owner');
      expect(createIssue?.inputSchema.required).toContain('repo');
      expect(createIssue?.inputSchema.required).toContain('title');
    });

    it('Slack tools should have required fields', () => {
      const tools = MCPServerRegistry.getServerTools('slack');
      const sendMessage = tools.find((t: any) => t.name === 'send_message');

      expect(sendMessage?.inputSchema.required).toContain('channel');
      expect(sendMessage?.inputSchema.required).toContain('text');
    });

    it('Notion tools should have required fields', () => {
      const tools = MCPServerRegistry.getServerTools('notion');
      const createPage = tools.find((t: any) => t.name === 'create_page');

      expect(createPage?.inputSchema.required).toContain('parent');
      expect(createPage?.inputSchema.required).toContain('properties');
    });
  });

  describe('Server Tool Counts', () => {
    it('GitHub should have 8+ tools', () => {
      const tools = MCPServerRegistry.getServerTools('github');
      expect(tools.length).toBeGreaterThanOrEqual(8);
    });

    it('Slack should have 10+ tools', () => {
      const tools = MCPServerRegistry.getServerTools('slack');
      expect(tools.length).toBeGreaterThanOrEqual(10);
    });

    it('Notion should have 10+ tools', () => {
      const tools = MCPServerRegistry.getServerTools('notion');
      expect(tools.length).toBeGreaterThanOrEqual(10);
    });
  });
});
