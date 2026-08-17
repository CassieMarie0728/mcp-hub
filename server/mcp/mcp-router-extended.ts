/**
 * Compatibility router for the retired provider registry.
 *
 * GitHub, Slack, and Notion REST APIs cannot be registered as MCP servers by
 * appending a fictional `/mcp` path. Real connections belong in the canonical
 * HTTPS-only MCP registration workflow until a durable provider-specific MCP
 * integration exists.
 */

import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { requireTenantLifecyclePersistence } from "../security/feature-availability";

const registryUnavailable = () =>
  requireTenantLifecyclePersistence("Registry-backed provider connections");

export const mcpExtendedRouter = router({
  getAvailableServers: protectedProcedure.query(registryUnavailable),
  getServerDefinition: protectedProcedure.input(z.object({ type: z.string() })).query(registryUnavailable),
  getServerTools: protectedProcedure.input(z.object({ type: z.string() })).query(registryUnavailable),
  validateToken: protectedProcedure.input(z.object({ type: z.string(), token: z.string().min(1) })).mutation(registryUnavailable),
  registerRealServer: protectedProcedure.input(z.object({
    type: z.string(),
    token: z.string().min(1),
    customName: z.string().trim().min(1).max(255).optional(),
  })).mutation(registryUnavailable),
  getRegisteredServers: protectedProcedure.query(registryUnavailable),
  discoverServerTools: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(registryUnavailable),
  executeServerTool: protectedProcedure.input(z.object({
    serverId: z.string().uuid(),
    toolName: z.string().trim().min(1).max(255),
    parameters: z.record(z.string(), z.unknown()),
  })).mutation(registryUnavailable),
  testServerConnection: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(registryUnavailable),
  unregisterServer: protectedProcedure.input(z.object({ serverId: z.string().uuid() })).mutation(registryUnavailable),
});

export type MCPExtendedRouter = typeof mcpExtendedRouter;
