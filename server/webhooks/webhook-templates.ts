export interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  serverType: 'github' | 'slack' | 'notion';
  eventType: string;
  payloadMapping: Record<string, unknown>;
  workflowId?: string;
  createdAt: Date;
}

export class WebhookTemplateManager {
  static readonly TEMPLATES: WebhookTemplate[] = [
    {
      id: 'github-issue-created',
      name: 'GitHub Issue Created',
      description: 'Trigger workflow when GitHub issue is created',
      serverType: 'github',
      eventType: 'issues.opened',
      payloadMapping: {
        title: '$.issue.title',
        body: '$.issue.body',
        author: '$.issue.user.login',
        url: '$.issue.html_url',
      },
      createdAt: new Date(),
    },
    {
      id: 'slack-message-posted',
      name: 'Slack Message Posted',
      description: 'Trigger workflow when message is posted to Slack',
      serverType: 'slack',
      eventType: 'message',
      payloadMapping: {
        text: '$.text',
        channel: '$.channel',
        user: '$.user',
        timestamp: '$.ts',
      },
      createdAt: new Date(),
    },
    {
      id: 'notion-page-created',
      name: 'Notion Page Created',
      description: 'Trigger workflow when Notion page is created',
      serverType: 'notion',
      eventType: 'page.created',
      payloadMapping: {
        title: '$.properties.title.title[0].plain_text',
        url: '$.url',
        created: '$.created_time',
      },
      createdAt: new Date(),
    },
  ];

  static getTemplate(id: string): WebhookTemplate | undefined {
    return this.TEMPLATES.find((t) => t.id === id);
  }

  static listTemplates(): WebhookTemplate[] {
    return this.TEMPLATES;
  }

  static listByServer(serverType: string): WebhookTemplate[] {
    return this.TEMPLATES.filter((t) => t.serverType === serverType);
  }
}
