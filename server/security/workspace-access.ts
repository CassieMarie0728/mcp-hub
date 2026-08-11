import { eq } from "drizzle-orm";

import { workspaces } from "../../drizzle/schema";
import { getDb } from "../db";

export type WorkspaceAccess = {
  workspaceId: string;
  userId: number;
};

type AuthenticatedUser = {
  id: number;
};

/**
 * Provides the sole workspace boundary used by MCP persistence. A user receives
 * one personal workspace today; collaborative workspaces can be added without
 * weakening ownership checks at each repository call site.
 */
export async function getOrCreatePersonalWorkspaceAccess(
  user: AuthenticatedUser,
): Promise<WorkspaceAccess> {
  const db = await getDb();
  if (!db) {
    throw new Error("Durable MCP storage is not available");
  }

  const existing = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, user.id))
    .limit(1);

  if (existing[0]) {
    return { workspaceId: existing[0].id, userId: user.id };
  }

  const workspaceId = crypto.randomUUID();
  await db.insert(workspaces).values({
    id: workspaceId,
    ownerUserId: user.id,
    name: "Personal workspace",
  });

  return { workspaceId, userId: user.id };
}
