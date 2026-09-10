/**
 * tRPC Router for Workflow Templates
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { WorkflowTemplateManager, type TemplateCloneInput } from './workflow-templates';

const templateCategorySchema = z.enum(['github', 'slack', 'notion', 'multi-server', 'custom']);

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
    .input(z.object({ templateId: z.string().trim().min(1).max(128) }))
    .query(({ input }) => {
      const template = WorkflowTemplateManager.getTemplate(input.templateId);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Template ${input.templateId} not found`,
        });
      }
      return template;
    }),

  /**
   * Clone a template
   */
  cloneTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string().trim().min(1).max(128),
        newName: z.string().trim().min(1).max(128),
        variables: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      const template = WorkflowTemplateManager.getTemplate(input.templateId);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Template ${input.templateId} not found`,
        });
      }
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
        category: templateCategorySchema.optional(),
        tags: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
        searchText: z.string().trim().max(256).optional(),
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
    .input(z.object({ category: templateCategorySchema }))
    .query(({ input }) => {
      return WorkflowTemplateManager.searchTemplates({
        category: input.category,
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
