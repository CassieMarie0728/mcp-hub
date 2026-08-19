import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { discoverAuthorizedMcpTools, executeAuthorizedMcpTool, getAuthorizedMcpServer } from "../mcp/secure-mcp-operations";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import {
  consumeAssistantToolProposal,
  createAssistantToolProposal,
  getAuthorizedAssistantProvider,
  getPublicAssistantProviderConfig,
  listAssistantProviderHealth,
  listProviderAlertPreferences,
  listPublicAssistantProviderConfigs,
  rejectAssistantToolProposal,
  removeAssistantProviderConfig,
  saveAssistantProviderHealth,
  saveAssistantProviderConfig,
  setProviderAlertPreference,
} from "./assistant-repository";
import { askConfiguredAssistantProvider } from "./assistant-provider-client";
import { ASSISTANT_PROVIDERS, type AssistantProviderId } from "./assistant-repository";
import { testAssistantProviderKey } from "./provider-health-client";

const conversationSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8_000),
  })).min(1).max(24),
  serverId: z.string().uuid().optional(),
  provider: z.enum(ASSISTANT_PROVIDERS),
});

async function workspaceFor(ctx: { user: { id: number } | null }) {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication is required" });
  return getOrCreatePersonalWorkspaceAccess(ctx.user);
}

function unavailable(message: string): never {
  throw new TRPCError({ code: "PRECONDITION_FAILED", message });
}

export const assistantRouter = router({
  listProviderConfigurations: protectedProcedure.query(async ({ ctx }) =>
    listPublicAssistantProviderConfigs(await workspaceFor(ctx)),
  ),

  getProviderConfiguration: protectedProcedure.query(async ({ ctx }) =>
    getPublicAssistantProviderConfig(await workspaceFor(ctx)),
  ),

  listProviderHealth: protectedProcedure.query(async ({ ctx }) =>
    listAssistantProviderHealth(await workspaceFor(ctx)),
  ),

  listProviderAlertPreferences: protectedProcedure.query(async ({ ctx }) =>
    listProviderAlertPreferences(await workspaceFor(ctx)),
  ),

  testProviderKey: protectedProcedure.input(z.object({ provider: z.enum(ASSISTANT_PROVIDERS) })).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    const configured = await getAuthorizedAssistantProvider(access, input.provider);
    if (!configured) unavailable(`Save a ${input.provider} key before testing it`);
    try {
      const result = await testAssistantProviderKey(configured);
      const health = await saveAssistantProviderHealth(access, {
        provider: result.provider,
        status: result.status,
        remainingRequests: result.remainingRequests,
        remainingTokens: result.remainingTokens,
        remainingCredit: result.remainingCredit,
        resetAt: result.resetAt,
        source: result.source,
      });
      return { health, message: result.message, canScheduleResetAlert: Boolean(result.resetAt) };
    } catch {
      unavailable("Provider key testing is temporarily unavailable. No alternate provider was tried.");
    }
  }),

  setProviderResetAlert: protectedProcedure.input(z.object({
    provider: z.enum(ASSISTANT_PROVIDERS),
    enabled: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    const configured = await getAuthorizedAssistantProvider(access, input.provider);
    if (!configured) unavailable("Save this provider key before enabling a reset alert");
    return setProviderAlertPreference(access, input.provider, input.enabled);
  }),

  saveProviderConfiguration: protectedProcedure.input(z.object({
    provider: z.enum(ASSISTANT_PROVIDERS),
    model: z.string().trim().min(4).max(160),
    apiKey: z.string().min(8).max(4_096),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await saveAssistantProviderConfig(await workspaceFor(ctx), input);
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "Assistant provider configuration could not be saved");
    }
  }),

  removeProviderConfiguration: protectedProcedure.input(z.object({ provider: z.enum(ASSISTANT_PROVIDERS) })).mutation(async ({ ctx, input }) => {
    await removeAssistantProviderConfig(await workspaceFor(ctx), input.provider);
    return { success: true };
  }),

  converse: protectedProcedure.input(conversationSchema).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    const provider = await getAuthorizedAssistantProvider(access, input.provider);
    if (!provider) unavailable("Configure your own assistant provider key before starting a conversation");

    let tools: Awaited<ReturnType<typeof discoverAuthorizedMcpTools>> = [];
    let serverName: string | undefined;
    if (input.serverId) {
      const server = await getAuthorizedMcpServer(access, input.serverId);
      serverName = server.name;
      tools = await discoverAuthorizedMcpTools(access, input.serverId);
    }

    try {
      const response = await askConfiguredAssistantProvider(provider, input.messages, tools);
      if (!response.toolCall) return { response: response.text, proposal: null };
      if (!input.serverId) unavailable("Select one of your connected servers before proposing a tool action");
      if (!tools.some((tool) => tool.name === response.toolCall?.name)) {
        unavailable("The assistant proposed a tool that is not available on the selected server");
      }
      const proposal = await createAssistantToolProposal(access, {
        serverId: input.serverId,
        toolName: response.toolCall.name,
        toolInput: response.toolCall.input,
      });
      return { response: response.text, proposal: { ...proposal, serverName } };
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "The configured assistant provider is unavailable");
    }
  }),

  decideToolProposal: protectedProcedure.input(z.object({
    proposalId: z.string().uuid(),
    approved: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    if (!input.approved) {
      await rejectAssistantToolProposal(access, input.proposalId);
      return { approved: false, executed: false, message: "Tool action declined" };
    }
    try {
      const proposal = await consumeAssistantToolProposal(access, input.proposalId);
      const result = await executeAuthorizedMcpTool(access, proposal.serverId, proposal.toolName, proposal.input);
      return {
        approved: true,
        executed: result.success,
        message: result.success ? "Approved tool action completed" : "Approved tool action did not complete",
      };
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "Tool approval could not be completed");
    }
  }),
});
