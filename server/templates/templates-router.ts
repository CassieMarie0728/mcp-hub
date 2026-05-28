/**
 * tRPC Router for Workflow Templates
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { WorkflowTemplateManager, type TemplateCloneInput } from './workflow-templates';

export const templatesRouter = router({
  /**
   * Get all public templates
   */
  getAllTemplates: publicProcedure.query(() => {
    return WorkflowTemplateManager.getAllTemplates();
  }),

  /**
   * Get template by ID
   */
  getTemplate: publicProcedure
    .input(z.object({ templateId: z.string() }))
    .query(({ input }) => {
      const template = WorkflowTemplateManager.getTemplate(input.templateId);
      if (!template) {
        throw new Error(`Template ${input.templateId} not found`);
      }
      return template;
    }),

  /**
   * Clone a template
   */
  cloneTemplate: publicProcedure
    .input(
      z.object({
        templateId: z.string(),
        newName: z.string(),
        variables: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(({ input }) => {
      const cloneInput: TemplateCloneInput = {
        templateId: input.templateId,
        newName: input.newName,
        variables: input.variables,
      };
      return WorkflowTemplateManager.cloneTemplate(cloneInput);
    }),

  /**
   * Search templates
   */
  searchTemplates: publicProcedure
    .input(
      z.object({
        category: z.enum(['github', 'slack', 'notion', 'multi-server', 'custom']).optional(),
        tags: z.array(z.string()).optional(),
        searchText: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return WorkflowTemplateManager.searchTemplates({
        category: input.category,
        tags: input.tags,
        searchText: input.searchText,
      });
    }),

  /**
   * Get templates by category
   */
  getTemplatesByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return WorkflowTemplateManager.searchTemplates({
        category: input.category as any,
      });
    }),

  /**
   * Get featured templates
   */
  getFeaturedTemplates: publicProcedure.query(() => {
    const allTemplates = WorkflowTemplateManager.getAllTemplates();
    return allTemplates.sort((a, b) => b.rating - a.rating).slice(0, 5);
  }),
});
