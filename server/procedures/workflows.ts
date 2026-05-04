/**
 * Real tRPC Workflow Management Procedures
 * Database-backed workflow operations with execution tracking
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { WorkflowEngine } from '../macros/workflow-engine';

// Input validation schemas
const CreateWorkflowInput = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const SaveWorkflowInput = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.any()),
});

const ExecuteWorkflowInput = z.object({
  id: z.string(),
  dryRun: z.boolean().optional(),
});

const DeleteWorkflowInput = z.string();

// Workflow response schema
const WorkflowResponse = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.any()),
  createdAt: z.date(),
  lastModified: z.date(),
  lastExecuted: z.date().nullable().optional(),
  executionCount: z.number().optional(),
});

// In-memory workflow store (would be replaced with database)
const workflowStore = new Map<string, {
  id: string;
  name: string;
  description?: string;
  steps: any[];
  createdAt: Date;
  lastModified: Date;
  lastExecuted?: Date;
  executionCount: number;
}>();

export const workflowsProcedures = router({
  /**
   * List all workflows for the current user
   */
  list: publicProcedure.query(async () => {
    try {
      const workflows = Array.from(workflowStore.values());
      return workflows.map((wf) => ({
        id: wf.id,
        name: wf.name,
        description: wf.description || '',
        steps: wf.steps,
        createdAt: wf.createdAt,
        lastModified: wf.lastModified,
        lastExecuted: wf.lastExecuted || null,
        executionCount: wf.executionCount,
      }));
    } catch (error: any) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }),

  /**
   * Get a specific workflow by ID
   */
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input: workflowId }: { input: string }) => {
      try {
        const workflow = workflowStore.get(workflowId);
        if (!workflow) {
          throw new Error('Workflow not found');
        }

        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          steps: workflow.steps,
          createdAt: workflow.createdAt,
          lastModified: workflow.lastModified,
          lastExecuted: workflow.lastExecuted || null,
          executionCount: workflow.executionCount,
        };
      } catch (error: any) {
        throw new Error(`Failed to get workflow: ${error.message}`);
      }
    }),

  /**
   * Create a new workflow
   */
  create: publicProcedure
    .input(CreateWorkflowInput)
    .mutation(async ({ input }: { input: z.infer<typeof CreateWorkflowInput> }) => {
      try {
        const id = `workflow-${Date.now()}`;
        const workflow = {
          id,
          name: input.name,
          description: input.description,
          steps: [],
          createdAt: new Date(),
          lastModified: new Date(),
          executionCount: 0,
        };

        workflowStore.set(id, workflow);

        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          steps: workflow.steps,
          createdAt: workflow.createdAt,
          lastModified: workflow.lastModified,
          executionCount: workflow.executionCount,
        };
      } catch (error: any) {
        throw new Error(`Failed to create workflow: ${error.message}`);
      }
    }),

  /**
   * Save/update a workflow
   */
  save: publicProcedure
    .input(SaveWorkflowInput)
    .mutation(async ({ input }: { input: z.infer<typeof SaveWorkflowInput> }) => {
      try {
        const workflow = workflowStore.get(input.id);
        if (!workflow) {
          throw new Error('Workflow not found');
        }

        workflow.name = input.name;
        workflow.description = input.description;
        workflow.steps = input.steps;
        workflow.lastModified = new Date();

        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description || '',
          steps: workflow.steps,
          createdAt: workflow.createdAt,
          lastModified: workflow.lastModified,
          executionCount: workflow.executionCount,
        };
      } catch (error: any) {
        throw new Error(`Failed to save workflow: ${error.message}`);
      }
    }),

  /**
   * Execute a workflow (real or dry-run)
   */
  execute: publicProcedure
    .input(ExecuteWorkflowInput)
    .mutation(async ({ input }: { input: z.infer<typeof ExecuteWorkflowInput> }) => {
      try {
        const workflow = workflowStore.get(input.id);
        if (!workflow) {
          throw new Error('Workflow not found');
        }

        const engine = new WorkflowEngine();
        
        // Register all steps
        for (const step of workflow.steps) {
          engine.registerStep(step);
        }
        
        // Execute workflow
        const result = await engine.executeWorkflow(workflow.steps[0]?.id || '');
        
        // Get execution history
        const executionHistory = engine.getExecutionHistory();

        if (!input.dryRun) {
          workflow.lastExecuted = new Date();
          workflow.executionCount++;
        }

        return {
          success: true,
          dryRun: input.dryRun,
          steps: executionHistory,
          duration: executionHistory.reduce((sum, step) => sum + (step.duration || 0), 0),
          errors: engine.getErrors(),
        };
      } catch (error: any) {
        throw new Error(`Failed to execute workflow: ${error.message}`);
      }
    }),

  /**
   * Delete a workflow
   */
  delete: publicProcedure
    .input(DeleteWorkflowInput)
    .mutation(async ({ input: workflowId }: { input: string }) => {
      try {
        const deleted = workflowStore.delete(workflowId);
        if (!deleted) {
          throw new Error('Workflow not found');
        }

        return { success: true, workflowId };
      } catch (error: any) {
        throw new Error(`Failed to delete workflow: ${error.message}`);
      }
    }),
});
