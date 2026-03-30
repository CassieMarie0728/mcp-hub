/**
 * Macro Templates System
 * Pre-built templates for common workflows
 */
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

    // Message Automation Template
    this.templates.set('message_automation', {
      id: 'message_automation',
      name: 'Message Automation',
      description: 'Send messages via WhatsApp, Telegram, or SMS',
      category: 'messaging',
      difficulty: 'beginner',
      tags: ['messaging', 'whatsapp', 'telegram', 'sms'],
      actions: [
        { type: 'tap', target: 'WhatsApp App', delay: 500 },
        { type: 'tap', target: 'New Chat', delay: 300 },
        { type: 'type', text: '${contact_name}', delay: 200 },
        { type: 'tap', target: 'Contact', delay: 300 },
        { type: 'tap', target: 'Message Field', delay: 300 },
        { type: 'type', text: '${message_text}', delay: 200 },
        { type: 'tap', target: 'Send', delay: 500 },
      ],
      variables: [
        { name: 'contact_name', type: 'string', required: true },
        { name: 'message_text', type: 'string', required: true },
      ],
      estimatedTime: '1-2 minutes',
      successRate: 0.91,
      downloads: 2100,
      rating: 4.6,
    });

    // Screenshot & Share Template
    this.templates.set('screenshot_share', {
      id: 'screenshot_share',
      name: 'Screenshot & Share',
      description: 'Take screenshot and share to social media',
      category: 'media',
      difficulty: 'beginner',
      tags: ['screenshot', 'share', 'media'],
      actions: [
        { type: 'key', key: 'power_volume_down', delay: 500 },
        { type: 'wait', duration: 1000, delay: 0 },
        { type: 'tap', target: 'Share', delay: 300 },
        { type: 'tap', target: 'Social App', delay: 300 },
        { type: 'tap', target: 'Caption Field', delay: 300 },
        { type: 'type', text: '${share_caption}', delay: 200 },
        { type: 'tap', target: 'Share', delay: 500 },
      ],
      variables: [
        { name: 'share_caption', type: 'string', required: false },
      ],
      estimatedTime: '1-2 minutes',
      successRate: 0.85,
      downloads: 620,
      rating: 4.3,
    });

    // Daily Reminder Template
    this.templates.set('daily_reminder', {
      id: 'daily_reminder',
      name: 'Daily Reminder',
      description: 'Set up daily reminders for tasks',
      category: 'productivity',
      difficulty: 'intermediate',
      tags: ['reminder', 'schedule', 'notification'],
      actions: [
        { type: 'tap', target: 'Calendar App', delay: 500 },
        { type: 'tap', target: 'New Event', delay: 300 },
        { type: 'type', text: '${event_title}', delay: 200 },
        { type: 'tap', target: 'Time Field', delay: 300 },
        { type: 'type', text: '${event_time}', delay: 200 },
        { type: 'tap', target: 'Repeat Daily', delay: 300 },
        { type: 'tap', target: 'Save', delay: 500 },
      ],
      variables: [
        { name: 'event_title', type: 'string', required: true },
        { name: 'event_time', type: 'string', required: true },
      ],
      estimatedTime: '2-3 minutes',
      successRate: 0.93,
      downloads: 890,
      rating: 4.7,
    });
  }

  /**
   * Get all templates
   */
  getAllTemplates(): MacroTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): MacroTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): MacroTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.category === category);
  }

  /**
   * Get templates by difficulty
   */
  getTemplatesByDifficulty(difficulty: string): MacroTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.difficulty === difficulty);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): MacroTemplate[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.templates.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get trending templates
   */
  getTrendingTemplates(limit: number = 10): MacroTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get top-rated templates
   */
  getTopRatedTemplates(limit: number = 10): MacroTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Create macro from template
   */
  createMacroFromTemplate(
    userId: string,
    templateId: string,
    macroName: string,
    variables: Record<string, any>
  ): UserMacro {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    const missingVars = template.variables
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.name);

    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    // Substitute variables in actions
    const substitutedActions = template.actions.map((action) => {
      if (action.type === 'type' && action.text) {
        let text = action.text;
        Object.entries(variables).forEach(([key, value]) => {
          text = text.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
        });
        return { ...action, text };
      }
      return action;
    });

    const macro: UserMacro = {
      id: `macro_${Date.now()}`,
      userId,
      name: macroName,
      templateId,
      actions: substitutedActions,
      variables,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store user macro
    const userMacros = this.userTemplates.get(userId) || [];
    userMacros.push(macro);
    this.userTemplates.set(userId, userMacros);

    return macro;
  }

  /**
   * Get user macros from templates
   */
  getUserMacros(userId: string): UserMacro[] {
    return this.userTemplates.get(userId) || [];
  }

  /**
   * Get categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach((template) => {
      categories.add(template.category);
    });
    return Array.from(categories).sort();
  }

  /**
   * Get template statistics
   */
  getTemplateStatistics(): TemplateStatistics {
    const templates = Array.from(this.templates.values());

    return {
      totalTemplates: templates.length,
      totalDownloads: templates.reduce((sum, t) => sum + t.downloads, 0),
      avgRating: templates.reduce((sum, t) => sum + t.rating, 0) / templates.length,
      byCategory: this.getCategories().reduce(
        (acc, cat) => {
          acc[cat] = this.getTemplatesByCategory(cat).length;
          return acc;
        },
        {} as Record<string, number>
      ),
      byDifficulty: {
        beginner: this.getTemplatesByDifficulty('beginner').length,
        intermediate: this.getTemplatesByDifficulty('intermediate').length,
        advanced: this.getTemplatesByDifficulty('advanced').length,
      },
    };
  }

  /**
   * Export template
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) return '';

    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template
   */
  importTemplate(templateData: string): MacroTemplate {
    const template = JSON.parse(templateData) as MacroTemplate;

    if (!template.id || !template.name || !template.actions) {
      throw new Error('Invalid template format');
    }

    this.templates.set(template.id, template);
    return template;
  }
}

/**
 * Macro template
 */
export interface MacroTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  actions: any[];
  variables: TemplateVariable[];
  estimatedTime: string;
  successRate: number;
  downloads: number;
  rating: number;
}

/**
 * Template variable
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

/**
 * User macro from template
 */
export interface UserMacro {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  actions: any[];
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template statistics
 */
export interface TemplateStatistics {
  totalTemplates: number;
  totalDownloads: number;
  avgRating: number;
  byCategory: Record<string, number>;
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}
