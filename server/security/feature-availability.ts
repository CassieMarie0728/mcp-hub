import { TRPCError } from "@trpc/server";

/**
 * Stops feature-shaped endpoints from creating insecure partial state while
 * their tenant-scoped durable models are still intentionally unimplemented.
 */
export function requireTenantLifecyclePersistence(feature: string): never {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${feature} is unavailable until tenant-scoped durable persistence is implemented.`,
  });
}
