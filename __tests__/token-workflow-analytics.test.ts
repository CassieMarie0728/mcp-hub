/**
 * Comprehensive Tests for Token Management, Workflows, and Analytics
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import TokenManager from '../../server/tokens/token-manager';
import WorkflowEngine from '../../server/macros/workflow-engine';
import ExecutionAnalytics from '../../server/analytics/execution-analytics';

describe('Token Management System', () => {
  beforeEach(async () => {
    await TokenManager.clearAllTokens();
  });

  describe('Token Storage & Encryption', () => {
    it('should store and retrieve tokens securely', async () => {
      const metadata = await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'My GitHub Token',
        token: 'ghp_1234567890abcdef',
      });

      expect(metadata.id).toBeDefined();
      expect(metadata.maskedToken).toBe('••••cdef');
      expect(metadata.isActive).toBe(true);
    });

    it('should mask tokens for display', async () => {
      const metadata = await TokenManager.storeToken({
        serverId: 'slack-1',
        serverType: 'slack',
        name: 'Slack Bot Token',
        token: 'xoxb-1234567890-abcdefghij',
      });

      expect(metadata.maskedToken).toBe('••••ghij');
      expect(metadata.maskedToken).not.toContain('xoxb');
    });

    it('should list tokens for a server', async () => {
      await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Token 1',
        token: 'token1',
      });

      await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Token 2',
        token: 'token2',
      });

      const tokens = await TokenManager.listServerTokens('github-1');
      expect(tokens.length).toBe(2);
      expect(tokens.every((t) => t.serverId === 'github-1')).toBe(true);
    });
  });

  describe('Token Lifecycle', () => {
    it('should revoke tokens', async () => {
      const metadata = await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Test Token',
        token: 'test-token',
      });

      const revoked = await TokenManager.revokeToken(metadata.id);
      expect(revoked).toBe(true);

      const revokedMetadata = await TokenManager.getTokenMetadata(metadata.id);
      expect(revokedMetadata?.isActive).toBe(false);
    });

    it('should rotate tokens', async () => {
      const original = await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Original Token',
        token: 'original-token',
      });

      const rotated = await TokenManager.rotateToken(original.id, 'new-token');

      expect(rotated).toBeDefined();
      expect(rotated?.name).toContain('rotated');

      const originalMetadata = await TokenManager.getTokenMetadata(original.id);
      expect(originalMetadata?.isActive).toBe(false);
    });

    it('should track token expiration', async () => {
      const expiresAt = new Date(Date.now() + 1000); // 1 second from now
      const metadata = await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Expiring Token',
        token: 'expiring-token',
        expiresAt,
      });

      expect(TokenManager.isTokenExpired(metadata)).toBe(false);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(TokenManager.isTokenExpired(metadata)).toBe(true);
    });
  });

  describe('Token Statistics', () => {
    it('should track token statistics', async () => {
      await TokenManager.storeToken({
        serverId: 'github-1',
        serverType: 'github',
        name: 'Token 1',
        token: 'token1',
      });

      await TokenManager.storeToken({
        serverId: 'slack-1',
        serverType: 'slack',
        name: 'Token 2',
        token: 'token2',
      });

      const stats = await TokenManager.getTokenStats();

      expect(stats.total).toBe(2);
      expect(stats.active).toBe(2);
      expect(stats.byServer['github']).toBe(1);
      expect(stats.byServer['slack']).toBe(1);
    });
  });
});

describe('Advanced Workflow Engine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  describe('Workflow Steps', () => {
    it('should register and execute tool steps', async () => {
      engine.registerStep({
        id: 'step1',
        type: 'tool',
        name: 'Create GitHub Issue',
        config: { tool: 'create_issue', repo: '${repo}' },
      });

      engine.setVariable('repo', 'my-repo');

      const context = await engine.executeWorkflow('step1');

      expect(context.executionHistory.length).toBeGreaterThan(0);
      expect(context.executionHistory[0].status).toBe('success');
    });

    it('should support conditional execution', async () => {
      engine.registerStep({
        id: 'step1',
        type: 'condition',
        name: 'Check Status',
        config: { conditionId: 'cond1' },
        nextStepId: 'step2',
      });

      engine.registerStep({
        id: 'step2',
        type: 'tool',
        name: 'Send Notification',
        config: { tool: 'send_message' },
      });

      engine.registerCondition('cond1', {
        variable: 'status',
        operator: 'equals',
        value: 'success',
        trueBranchId: 'step2',
      });

      engine.setVariable('status', 'success');

      const context = await engine.executeWorkflow('step1');

      expect(context.executionHistory.length).toBeGreaterThan(0);
    });

    it('should support loops', async () => {
      engine.registerStep({
        id: 'loop1',
        type: 'loop',
        name: 'Process Items',
        config: { loopId: 'loop-config' },
      });

      engine.registerStep({
        id: 'step1',
        type: 'tool',
        name: 'Process Item',
        config: { tool: 'process', item: '${item}' },
      });

      engine.registerLoop('loop-config', {
        variableName: 'item',
        iterableVariable: 'items',
        bodyStepId: 'step1',
      });

      engine.setVariable('items', ['item1', 'item2', 'item3']);

      const context = await engine.executeWorkflow('loop1');

      expect(context.executionHistory.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Control', () => {
    it('should pause and resume workflows', async () => {
      engine.registerStep({
        id: 'step1',
        type: 'tool',
        name: 'Test Step',
        config: {},
      });

      engine.pauseWorkflow();
      expect(engine.getContext().isPaused).toBe(true);

      engine.resumeWorkflow();
      expect(engine.getContext().isPaused).toBe(false);
    });

    it('should stop workflows', async () => {
      engine.registerStep({
        id: 'step1',
        type: 'tool',
        name: 'Test Step',
        config: {},
      });

      engine.stopWorkflow();
      expect(engine.getContext().isRunning).toBe(false);
    });

    it('should reset workflow state', () => {
      engine.setVariable('test', 'value');
      engine.reset();

      expect(engine.getVariable('test')).toBeUndefined();
      expect(engine.getExecutionHistory().length).toBe(0);
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute variables in step config', async () => {
      engine.registerStep({
        id: 'step1',
        type: 'tool',
        name: 'Create Issue',
        config: { title: '${title}', body: '${body}' },
      });

      engine.setVariable('title', 'Bug Report');
      engine.setVariable('body', 'Found a bug');

      const context = await engine.executeWorkflow('step1');

      expect(context.executionHistory[0].result).toBeDefined();
    });
  });
});

describe('Execution Analytics', () => {
  beforeEach(() => {
    ExecutionAnalytics.clearAnalytics();
  });

  describe('Execution Recording', () => {
    it('should record tool executions', () => {
      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 150,
        status: 'success',
        timestamp: new Date(),
      });

      const history = ExecutionAnalytics.getExecutionHistory();
      expect(history.length).toBe(1);
      expect(history[0].toolName).toBe('create_issue');
    });

    it('should track tool statistics', () => {
      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'success',
        timestamp: new Date(),
      });

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 200,
        status: 'success',
        timestamp: new Date(),
      });

      const stats = ExecutionAnalytics.getToolStats('create_issue');
      expect(stats.length).toBe(1);
      expect(stats[0].totalExecutions).toBe(2);
      expect(stats[0].successfulExecutions).toBe(2);
      expect(stats[0].averageExecutionTime).toBe(150);
    });

    it('should track server statistics', () => {
      ExecutionAnalytics.recordExecution({
        toolName: 'send_message',
        serverId: 'slack-1',
        executionTime: 50,
        status: 'success',
        timestamp: new Date(),
      });

      const stats = ExecutionAnalytics.getServerStats('slack-1');
      expect(stats.length).toBe(1);
      expect(stats[0].totalExecutions).toBe(1);
      expect(stats[0].successRate).toBe(100);
    });
  });

  describe('Analytics Filtering', () => {
    it('should filter execution history by tool', () => {
      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'success',
        timestamp: new Date(),
      });

      ExecutionAnalytics.recordExecution({
        toolName: 'send_message',
        serverId: 'slack-1',
        executionTime: 50,
        status: 'success',
        timestamp: new Date(),
      });

      const history = ExecutionAnalytics.getExecutionHistory({ toolName: 'create_issue' });
      expect(history.length).toBe(1);
      expect(history[0].toolName).toBe('create_issue');
    });

    it('should filter execution history by status', () => {
      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'success',
        timestamp: new Date(),
      });

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'failed',
        errorMessage: 'Permission denied',
        timestamp: new Date(),
      });

      const failed = ExecutionAnalytics.getExecutionHistory({ status: 'failed' });
      expect(failed.length).toBe(1);
      expect(failed[0].status).toBe('failed');
    });
  });

  describe('Analytics Reports', () => {
    it('should generate analytics reports', () => {
      const startDate = new Date(Date.now() - 86400000); // 1 day ago
      const endDate = new Date();

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'success',
        timestamp: new Date(),
      });

      const report = ExecutionAnalytics.generateReport(startDate, endDate);

      expect(report.summary.totalExecutions).toBe(1);
      expect(report.summary.successfulExecutions).toBe(1);
      expect(report.topTools.length).toBeGreaterThan(0);
    });

    it('should calculate error trends', () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'failed',
        errorMessage: 'Network timeout',
        timestamp: new Date(),
      });

      const trends = ExecutionAnalytics.getErrorTrends(startDate, endDate);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].errorCount).toBeGreaterThan(0);
    });

    it('should calculate performance trends', () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 100,
        status: 'success',
        timestamp: new Date(),
      });

      ExecutionAnalytics.recordExecution({
        toolName: 'create_issue',
        serverId: 'github-1',
        executionTime: 200,
        status: 'success',
        timestamp: new Date(),
      });

      const trends = ExecutionAnalytics.getPerformanceTrends(startDate, endDate);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].averageExecutionTime).toBeGreaterThan(0);
    });
  });
});
