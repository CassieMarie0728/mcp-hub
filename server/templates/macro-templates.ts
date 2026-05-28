/**
 * Macro Templates System
 * Pre-built templates for common workflows
 */

// Type definitions
interface MacroAction {
  type: string;
  target?: string;
  text?: string;
  delay?: number;
}

interface MacroVariable {
  name: string;
  type: string;
  required: boolean;
}

interface MacroTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  tags: string[];
  actions: MacroAction[];
  variables?: MacroVariable[];
  estimatedTime?: string;
  successRate?: number;
  downloads?: number;
  rating?: number;
}

interface UserTemplate extends MacroTemplate {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MacroTemplatesSystem {
  private templates: Map<string, MacroTemplate> = new Map();
  private userTemplates: Map<string, UserTemplate[]> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltInTemplates(): void {
    // Email Automation Template
    this.templates.set('email_automation', {
      id: 'email_automation',
      name: 'Email Automation',
      description: 'Automatically send emails with templates and attachments',
      category: 'productivity',
      difficulty: 'beginner',
      tags: ['email', 'automation', 'gmail'],
      actions: [
        { type: 'tap', target: 'Gmail App', delay: 500 },
        { type: 'tap', target: 'Compose', delay: 300 },
        { type: 'type', text: '${recipient_email}', delay: 200 },
        { type: 'tap', target: 'Subject Field', delay: 300 },
        { type: 'type', text: '${email_subject}', delay: 200 },
        { type: 'tap', target: 'Body Field', delay: 300 },
        { type: 'type', text: '${email_body}', delay: 200 },
        { type: 'tap', target: 'Send', delay: 500 },
      ],
      variables: [
        { name: 'recipient_email', type: 'string', required: true },
        { name: 'email_subject', type: 'string', required: true },
        { name: 'email_body', type: 'string', required: true },
      ],
      estimatedTime: '2-3 minutes',
      successRate: 0.92,
      downloads: 1250,
      rating: 4.7,
    });

    // Social Media Post Template
    this.templates.set('social_media_post', {
      id: 'social_media_post',
      name: 'Social Media Post',
      description: 'Post content to Instagram, Twitter, or Facebook',
      category: 'social',
      difficulty: 'beginner',
      tags: ['social', 'instagram', 'twitter', 'facebook'],
      actions: [
        { type: 'tap', target: 'Instagram App', delay: 500 },
        { type: 'tap', target: 'Create Post', delay: 300 },
        { type: 'tap', target: 'Select Image', delay: 300 },
        { type: 'tap', target: 'Caption Field', delay: 300 },
        { type: 'type', text: '${post_caption}', delay: 200 },
        { type: 'tap', target: 'Add Hashtags', delay: 300 },
        { type: 'type', text: '${hashtags}', delay: 200 },
        { type: 'tap', target: 'Share', delay: 500 },
      ],
      variables: [
        { name: 'post_caption', type: 'string', required: true },
        { name: 'hashtags', type: 'string', required: false },
      ],
      estimatedTime: '1-2 minutes',
      successRate: 0.88,
      downloads: 980,
      rating: 4.5,
    });

    // Data Entry Template
    this.templates.set('data_entry', {
      id: 'data_entry',
      name: 'Data Entry',
      description: 'Automatically fill forms with data',
      category: 'productivity',
      difficulty: 'intermediate',
      tags: ['forms', 'data', 'entry'],
      actions: [
        { type: 'tap', target: 'Form Field 1', delay: 300 },
        { type: 'type', text: '${field_1}', delay: 200 },
        { type: 'tap', target: 'Form Field 2', delay: 300 },
        { type: 'type', text: '${field_2}', delay: 200 },
        { type: 'tap', target: 'Form Field 3', delay: 300 },
        { type: 'type', text: '${field_3}', delay: 200 },
        { type: 'tap', target: 'Submit', delay: 500 },
      ],
      variables: [
        { name: 'field_1', type: 'string', required: true },
        { name: 'field_2', type: 'string', required: true },
        { name: 'field_3', type: 'string', required: true },
      ],
      estimatedTime: '1-2 minutes',
      successRate: 0.95,
      downloads: 750,
      rating: 4.8,
    });
  }

  /**
   * Get all built-in templates
   */
  public getAllTemplates(): MacroTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(templateId: string): MacroTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get user templates
   */
  public getUserTemplates(userId: string): UserTemplate[] {
    return this.userTemplates.get(userId) || [];
  }

  /**
   * Save user template
   */
  public saveUserTemplate(userId: string, template: UserTemplate): void {
    const userTemplates = this.userTemplates.get(userId) || [];
    userTemplates.push(template);
    this.userTemplates.set(userId, userTemplates);
  }

  /**
   * Delete user template
   */
  public deleteUserTemplate(userId: string, templateId: string): void {
    const userTemplates = this.userTemplates.get(userId) || [];
    const filtered = userTemplates.filter(t => t.id !== templateId);
    this.userTemplates.set(userId, filtered);
  }
}

export default new MacroTemplatesSystem();
