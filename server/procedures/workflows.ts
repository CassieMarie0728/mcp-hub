import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";
import { createWorkflowDraft, deleteWorkflowDraft, getWorkflowDraft, listWorkflowDrafts, saveWorkflowDraft } from "../lifecycle/lifecycle-repository";

const workflowId = z.string().uuid();
const definition = z.record(z.string(), z.unknown()).refine((value) => JSON.stringify(value).length <= 32_000, "Workflow definition is too large");

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

export const workflowsProcedures = router({
  list: protectedProcedure.query(async ({ ctx }) => listWorkflowDrafts(await workspaceFor(ctx))),
  getById: protectedProcedure.input(z.object({ workflowId })).query(async ({ ctx, input }) => getWorkflowDraft(await workspaceFor(ctx), input.workflowId)),
  create: protectedProcedure.input(z.object({ name: z.string().trim().min(1).max(128), description: z.string().trim().max(512).optional(), definition: definition.default({}) })).mutation(async ({ ctx, input }) => createWorkflowDraft(await workspaceFor(ctx), input)),
  save: protectedProcedure.input(z.object({ workflowId, name: z.string().trim().min(1).max(128).optional(), description: z.string().trim().max(512).optional(), definition: definition.optional(), status: z.enum(["draft", "archived"]).optional() })).mutation(async ({ ctx, input }) => saveWorkflowDraft(await workspaceFor(ctx), input.workflowId, input)),
  delete: protectedProcedure.input(z.object({ workflowId })).mutation(async ({ ctx, input }) => {
    await deleteWorkflowDraft(await workspaceFor(ctx), input.workflowId);
    return { success: true };
  }),
  execute: protectedProcedure.input(z.object({ workflowId })).mutation(() => requireTenantLifecyclePersistence("Workflow execution")),
});
