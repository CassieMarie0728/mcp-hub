/** Workflow routes remain fail-closed until durable tenant-scoped orchestration exists. */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const unavailable = (feature: string) => requireTenantLifecyclePersistence(feature);

export const workflowsProcedures = router({
  list: protectedProcedure.query(() => unavailable("Workflow listing")),
  getById: protectedProcedure.input(z.string().uuid()).query(() => unavailable("Workflow retrieval")),
  create: protectedProcedure.input(z.object({ name: z.string(), description: z.string().optional() })).mutation(() => unavailable("Workflow creation")),
  save: protectedProcedure.input(z.object({ id: z.string().uuid(), name: z.string(), description: z.string().optional(), steps: z.array(z.unknown()) })).mutation(() => unavailable("Workflow persistence")),
  execute: protectedProcedure.input(z.object({ id: z.string().uuid(), dryRun: z.boolean().optional() })).mutation(() => unavailable("Workflow execution")),
  delete: protectedProcedure.input(z.string().uuid()).mutation(() => unavailable("Workflow deletion")),
});
