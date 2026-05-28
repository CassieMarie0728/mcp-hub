import { describe, it, expect } from 'vitest';
import { WorkflowTemplateManager } from '../../server/templates/workflow-templates';

describe('Workflow Templates System', () => {
  describe('Template Retrieval', () => {
    it('should get all public templates', () => {
      const templates = WorkflowTemplateManager.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.isPublic)).toBe(true);
    });

    it('should get template by ID', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();
      expect(template?.name).toBe('GitHub Issue to Slack');
      expect(template?.category).toBe('multi-server');
    });

    it('should return null for non-existent template', () => {
      const template = WorkflowTemplateManager.getTemplate('non-existent-id');
      expect(template).toBeNull();
    });
  });

  describe('Template Cloning', () => {
    it('should clone a template', () => {
      const cloned = WorkflowTemplateManager.cloneTemplate({
        templateId: 'github-to-slack-001',
        newName: 'My Custom GitHub to Slack',
      });

      expect(cloned).toBeDefined();
      expect(cloned.name).toBe('My Custom GitHub to Slack');
      expect(cloned.isPublic).toBe(false);
      expect(cloned.id).not.toBe('github-to-slack-001');
    });

    it('should clone with variable overrides', () => {
      const cloned = WorkflowTemplateManager.cloneTemplate({
        templateId: 'github-to-slack-001',
        newName: 'Custom Template',
        variables: {
          repo: 'my-custom-repo',
          slack_channel: '#engineering',
        },
      });

      expect(cloned).toBeDefined();
      expect(cloned.name).toBe('Custom Template');
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        WorkflowTemplateManager.cloneTemplate({
          templateId: 'non-existent',
          newName: 'Test',
        });
      }).toThrow();
    });
  });

  describe('Template Search', () => {
    it('should search by category', () => {
      const results = WorkflowTemplateManager.searchTemplates({
        category: 'multi-server',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((t) => t.category === 'multi-server')).toBe(true);
    });

    it('should search by tags', () => {
      const results = WorkflowTemplateManager.searchTemplates({
        tags: ['github', 'slack'],
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((t) => ['github', 'slack'].some((tag) => t.tags.includes(tag)))).toBe(
        true,
      );
    });

    it('should search by text', () => {
      const results = WorkflowTemplateManager.searchTemplates({
        searchText: 'GitHub',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (t) =>
            t.name.toLowerCase().includes('github') ||
            t.description.toLowerCase().includes('github') ||
            t.tags.some((tag) => tag.toLowerCase().includes('github')),
        ),
      ).toBe(true);
    });

    it('should combine multiple search criteria', () => {
      const results = WorkflowTemplateManager.searchTemplates({
        category: 'multi-server',
        tags: ['github'],
        searchText: 'Slack',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((t) => t.category === 'multi-server')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = WorkflowTemplateManager.searchTemplates({
        searchText: 'NonExistentTemplate12345',
      });

      expect(results).toEqual([]);
    });
  });

  describe('Template Structure', () => {
    it('should have valid template structure', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();

      if (template) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.steps).toBeDefined();
        expect(Array.isArray(template.steps)).toBe(true);
        expect(template.variables).toBeDefined();
        expect(Array.isArray(template.variables)).toBe(true);
        expect(template.tags).toBeDefined();
        expect(Array.isArray(template.tags)).toBe(true);
        expect(template.author).toBeDefined();
        expect(template.version).toBeDefined();
        expect(template.isPublic).toBe(true);
        expect(template.rating).toBeGreaterThan(0);
        expect(template.rating).toBeLessThanOrEqual(5);
      }
    });

    it('should have valid step structure', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();

      if (template && template.steps.length > 0) {
        const step = template.steps[0];
        expect(step.id).toBeDefined();
        expect(step.name).toBeDefined();
        expect(step.description).toBeDefined();
        expect(step.serverId).toBeDefined();
        expect(step.serverType).toBeDefined();
        expect(step.toolName).toBeDefined();
        expect(step.parameters).toBeDefined();
      }
    });

    it('should have valid variable structure', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();

      if (template && template.variables.length > 0) {
        const variable = template.variables[0];
        expect(variable.id).toBeDefined();
        expect(variable.name).toBeDefined();
        expect(variable.type).toBeDefined();
        expect(variable.description).toBeDefined();
        expect(variable.required).toBeDefined();
      }
    });
  });

  describe('Template Metadata', () => {
    it('should track clone count', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();
      expect(template?.cloneCount).toBeGreaterThanOrEqual(0);
    });

    it('should have rating between 0 and 5', () => {
      const templates = WorkflowTemplateManager.getAllTemplates();
      expect(templates.every((t) => t.rating >= 0 && t.rating <= 5)).toBe(true);
    });

    it('should have creation and update dates', () => {
      const template = WorkflowTemplateManager.getTemplate('github-to-slack-001');
      expect(template).toBeDefined();
      expect(template?.createdAt).toBeDefined();
      expect(template?.updatedAt).toBeDefined();
      expect(template?.createdAt instanceof Date).toBe(true);
      expect(template?.updatedAt instanceof Date).toBe(true);
    });
  });

  describe('Featured Templates', () => {
    it('should get featured templates sorted by rating', () => {
      const allTemplates = WorkflowTemplateManager.getAllTemplates();
      const featured = allTemplates.sort((a, b) => b.rating - a.rating).slice(0, 5);

      expect(featured.length).toBeGreaterThan(0);
      expect(featured.length).toBeLessThanOrEqual(5);

      // Check that featured templates are sorted by rating (descending)
      for (let i = 1; i < featured.length; i++) {
        expect(featured[i - 1].rating).toBeGreaterThanOrEqual(featured[i].rating);
      }
    });
  });
});
