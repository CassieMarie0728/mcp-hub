import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      hostname: "localhost",
    } as any,
    res: {} as any,
  };
}

describe("Extended Router Security", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  describe("Workflows Router", () => {
    it("denies access to list for unauthenticated users", async () => {
      await expect(caller.workflows.list())
        .rejects.toThrow();
    });

    it("denies access to create for unauthenticated users", async () => {
      await expect(caller.workflows.create({ name: "test", description: "test" }))
        .rejects.toThrow();
    });
  });

  describe("Templates Router", () => {
    it("allows access to getAllTemplates (public)", async () => {
      const result = await caller.templates.getAllTemplates();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies access to cloneTemplate for unauthenticated users", async () => {
      await expect(caller.templates.cloneTemplate({
        templateId: "test",
        newName: "test",
      })).rejects.toThrow();
    });
  });
});
