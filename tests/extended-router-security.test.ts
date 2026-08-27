import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import { tokensProcedures } from "../server/procedures/tokens";
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
    it("denies access to list workflows for unauthenticated users", async () => {
      // @ts-ignore - workflows might not be in the type yet
      await expect(caller.workflows.list()).rejects.toThrow();
    });

    it("denies access to create workflow for unauthenticated users", async () => {
      // @ts-ignore
      await expect(caller.workflows.create({ name: "test" })).rejects.toThrow();
    });
  });

  describe("Templates Router", () => {
    it("denies access to cloneTemplate for unauthenticated users", async () => {
      // @ts-ignore
      await expect(caller.templates.cloneTemplate({
        templateId: "test",
        newName: "cloned",
      })).rejects.toThrow();
    });

    it("allows access to getAllTemplates (public)", async () => {
        // @ts-ignore
        const result = await caller.templates.getAllTemplates();
        expect(result).toBeDefined();
    });
  });

  describe("Token Procedures Router Security", () => {
    const tokensCaller = tokensProcedures.createCaller(ctx);

    it("denies list tokens to unauthenticated callers", async () => {
      await expect(tokensCaller.list()).rejects.toThrow();
    });

    it("denies getByServer tokens to unauthenticated callers", async () => {
      await expect(tokensCaller.getByServer("server-1")).rejects.toThrow();
    });

    it("denies store token to unauthenticated callers", async () => {
      await expect(
        tokensCaller.store({
          serverId: "server-1",
          serverType: "mcp",
          name: "test-token",
          token: "secret",
        })
      ).rejects.toThrow();
    });
  });
});
