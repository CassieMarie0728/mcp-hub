/**
 * Workflow Templates System
 * Manages pre-built automation templates that users can clone and customize
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'github' | 'slack' | 'notion' | 'multi-server' | 'custom';
  steps: TemplateStep[];
  variables: TemplateVariable[];
  tags: string[];
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  cloneCount: number;
  rating: number;
  documentation: string;
}

export interface TemplateStep {
  id: string;
  name: string;
  description: string;
  serverId: string;
  serverType: 'github' | 'slack' | 'notion';
  toolName: string;
  parameters: Record<string, unknown>;
  condition?: string;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
  timeout?: number;
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  defaultValue?: unknown;
  required: boolean;
  options?: unknown[];
}

export interface TemplateCloneInput {
  templateId: string;
  newName: string;
  variables?: Record<string, unknown>;
}

/**
 * In-memory template storage for MVP
 * In production, this would be persisted to database
 */
class WorkflowTemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // GitHub Issue → Slack Notification
    const githubToSlackTemplate: WorkflowTemplate = {
      id: 'github-to-slack-001',
      name: 'GitHub Issue to Slack',
      description: 'Create a GitHub issue and notify Slack channel',
      category: 'multi-server',
      steps: [
        {
          id: 'step-1',
          name: 'Create GitHub Issue',
          description: 'Create a new issue in GitHub repository',
          serverId: 'github-prod',
          serverType: 'github',
          toolName: 'create_issue',
          parameters: {
            repo: '{{ repo }}',
            title: '{{ issue_title }}',
            body: '{{ issue_body }}',
            labels: ['{{ issue_label }}'],
          },
        },
        {
          id: 'step-2',
          name: 'Send Slack Notification',
          description: 'Notify team in Slack about the new issue',
          serverId: 'slack-prod',
          serverType: 'slack',
          toolName: 'send_message',
          parameters: {
            channel: '{{ slack_channel }}',
            text: 'New issue created: {{ issue_title }}',
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '*New GitHub Issue*\n{{ issue_title }}\n{{ issue_body }}',
                },
              },
            ],
          },
        },
      ],
      variables: [
        {
          id: 'var-repo',
          name: 'repo',
          type: 'string',
          description: 'GitHub repository name',
          required: true,
        },
        {
          id: 'var-title',
          name: 'issue_title',
          type: 'string',
          description: 'Issue title',
          required: true,
        },
        {
          id: 'var-body',
          name: 'issue_body',
          type: 'string',
          description: 'Issue description',
          required: false,
        },
        {
          id: 'var-label',
          name: 'issue_label',
          type: 'string',
          description: 'Issue label',
          required: false,
          options: ['bug', 'feature', 'enhancement', 'documentation'],
        },
        {
          id: 'var-channel',
          name: 'slack_channel',
          type: 'string',
          description: 'Slack channel to notify',
          required: true,
        },
      ],
      tags: ['github', 'slack', 'automation', 'notifications'],
      author: 'MCP Hub',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      cloneCount: 0,
      rating: 4.8,
      documentation: 'This template creates a GitHub issue and sends a notification to Slack.',
    };

    // GitHub PR → Notion Database
    const githubToNotionTemplate: WorkflowTemplate = {
      id: 'github-to-notion-001',
      name: 'GitHub PR to Notion',
      description: 'Track GitHub pull requests in Notion database',
      category: 'multi-server',
      steps: [
        {
          id: 'step-1',
          name: 'Get GitHub PR Details',
          description: 'Retrieve pull request information',
          serverId: 'github-prod',
          serverType: 'github',
          toolName: 'get_pull_request',
          parameters: {
            repo: '{{ repo }}',
            pr_number: '{{ pr_number }}',
          },
        },
        {
          id: 'step-2',
          name: 'Add to Notion Database',
          description: 'Create entry in Notion database',
          serverId: 'notion-prod',
          serverType: 'notion',
          toolName: 'create_database_item',
          parameters: {
            database_id: '{{ notion_db_id }}',
            properties: {
              title: '{{ pr_title }}',
              url: '{{ pr_url }}',
              status: '{{ pr_status }}',
              author: '{{ pr_author }}',
              created_date: '{{ pr_created_at }}',
            },
          },
        },
      ],
      variables: [
        {
          id: 'var-repo',
          name: 'repo',
          type: 'string',
          description: 'GitHub repository',
          required: true,
        },
        {
          id: 'var-pr',
          name: 'pr_number',
          type: 'number',
          description: 'Pull request number',
          required: true,
        },
        {
          id: 'var-notion-db',
          name: 'notion_db_id',
          type: 'string',
          description: 'Notion database ID',
          required: true,
        },
      ],
      tags: ['github', 'notion', 'tracking', 'database'],
      author: 'MCP Hub',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      cloneCount: 0,
      rating: 4.6,
      documentation: 'Automatically track GitHub PRs in your Notion workspace.',
    };

    // Slack Message → GitHub Issue
    const slackToGithubTemplate: WorkflowTemplate = {
      id: 'slack-to-github-001',
      name: 'Slack to GitHub Issue',
      description: 'Convert Slack messages to GitHub issues',
      category: 'multi-server',
      steps: [
        {
          id: 'step-1',
          name: 'Create GitHub Issue from Slack',
          description: 'Create issue from Slack message',
          serverId: 'github-prod',
          serverType: 'github',
          toolName: 'create_issue',
          parameters: {
            repo: '{{ repo }}',
            title: '{{ message_title }}',
            body: '{{ message_body }}\n\nFrom Slack: {{ slack_user }}',
          },
        },
        {
          id: 'step-2',
          name: 'Reply in Slack',
          description: 'Send confirmation back to Slack',
          serverId: 'slack-prod',
          serverType: 'slack',
          toolName: 'send_message',
          parameters: {
            channel: '{{ slack_channel }}',
            text: 'Issue created: {{ issue_link }}',
          },
        },
      ],
      variables: [
        {
          id: 'var-repo',
          name: 'repo',
          type: 'string',
          description: 'GitHub repository',
          required: true,
        },
        {
          id: 'var-title',
          name: 'message_title',
          type: 'string',
          description: 'Issue title from Slack',
          required: true,
        },
        {
          id: 'var-body',
          name: 'message_body',
          type: 'string',
          description: 'Issue body from Slack',
          required: true,
        },
        {
          id: 'var-user',
          name: 'slack_user',
          type: 'string',
          description: 'Slack user who created message',
          required: false,
        },
        {
          id: 'var-channel',
          name: 'slack_channel',
          type: 'string',
          description: 'Slack channel',
          required: true,
        },
      ],
      tags: ['slack', 'github', 'conversion', 'issues'],
      author: 'MCP Hub',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      cloneCount: 0,
      rating: 4.5,
      documentation: 'Turn Slack messages into actionable GitHub issues.',
    };

    this.templates.set(githubToSlackTemplate.id, githubToSlackTemplate);
    this.templates.set(githubToNotionTemplate.id, githubToNotionTemplate);
    this.templates.set(slackToGithubTemplate.id, slackToGithubTemplate);
  }

  /**
   * Get all public templates
   */
  static getAllTemplates(): WorkflowTemplate[] {
    const instance = new WorkflowTemplateManager();
    return Array.from(instance.templates.values()).filter((t) => t.isPublic);
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): WorkflowTemplate | null {
    const instance = new WorkflowTemplateManager();
    return instance.templates.get(templateId) || null;
  }

  /**
   * Clone a template
   */
  static cloneTemplate(input: TemplateCloneInput): WorkflowTemplate {
    const instance = new WorkflowTemplateManager();
    const original = instance.templates.get(input.templateId);

    if (!original) {
      throw new Error(`Template ${input.templateId} not found`);
    }

    const cloned: WorkflowTemplate = {
      ...original,
      id: `cloned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: input.newName,
      isPublic: false,
      cloneCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Apply variable overrides if provided
    if (input.variables) {
      cloned.steps = cloned.steps.map((step) => ({
        ...step,
        parameters: Object.entries(step.parameters).reduce(
          (acc, [key, value]) => {
            if (typeof value === 'string' && value.includes('{{')) {
              const varName = value.match(/\{\{\s*(\w+)\s*\}\}/)?.[1];
              if (varName && input.variables?.[varName]) {
                acc[key] = input.variables[varName];
              } else {
                acc[key] = value;
              }
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, unknown>
        ),
      }));
    }

    return cloned;
  }

  /**
   * Search templates by category or tags
   */
  static searchTemplates(query: {
    category?: string;
    tags?: string[];
    searchText?: string;
  }): WorkflowTemplate[] {
    const instance = new WorkflowTemplateManager();
    return Array.from(instance.templates.values()).filter((template) => {
      if (!template.isPublic) return false;

      if (query.category && template.category !== query.category) return false;

      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some((tag) => template.tags.includes(tag));
        if (!hasTag) return false;
      }

      if (query.searchText) {
        const text = query.searchText.toLowerCase();
        return (
          template.name.toLowerCase().includes(text) ||
          template.description.toLowerCase().includes(text) ||
          template.tags.some((tag) => tag.toLowerCase().includes(text))
        );
      }

      return true;
    });
  }
}

export { WorkflowTemplateManager };
