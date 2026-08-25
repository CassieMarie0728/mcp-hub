import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../_core/trpc";
import { discoverAuthorizedMcpTools, executeAuthorizedMcpTool, getAuthorizedMcpServer } from "../mcp/secure-mcp-operations";
import { getOrCreatePersonalWorkspaceAccess } from "../security/workspace-access";
import {
  consumeAssistantToolProposal,
  consumeAssistantRetryRequest,
  createAssistantToolProposal,
  createAssistantRetryRequest,
  getAuthorizedAssistantProvider,
  getPublicAssistantProviderConfig,
  listAuthorizedFallbackProviders,
  listAssistantProviderHealth,
  listProviderAlertPreferences,
  listPublicAssistantProviderConfigs,
  rejectAssistantToolProposal,
  removeAssistantProviderConfig,
  saveAssistantProviderHealth,
  saveAssistantProviderConfig,
  setAssistantProviderFallback,
  setProviderAlertPreference,
} from "./assistant-repository";
import { AssistantProviderLimitError, askConfiguredAssistantProvider } from "./assistant-provider-client";
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

type ConversationInput = z.infer<typeof conversationSchema>;
type AssistantConversationResult = { response: string; proposal: (Awaited<ReturnType<typeof createAssistantToolProposal>> & { serverName?: string }) | null; providerUsed: AssistantProviderId; fallbackFrom?: AssistantProviderId; retryRequest: { id: string; expiresAt: Date; retryAt?: Date } | null };

async function runAssistantConversation(access: Awaited<ReturnType<typeof getOrCreatePersonalWorkspaceAccess>>, input: ConversationInput): Promise<AssistantConversationResult> {
  let tools: Awaited<ReturnType<typeof discoverAuthorizedMcpTools>> = [];
  let serverName: string | undefined;
  if (input.serverId) {
    const server = await getAuthorizedMcpServer(access, input.serverId);
    serverName = server.name;
    tools = await discoverAuthorizedMcpTools(access, input.serverId);
  }
  const callProvider = async (provider: NonNullable<Awaited<ReturnType<typeof getAuthorizedAssistantProvider>>>) => {
    const response = await askConfiguredAssistantProvider(provider, input.messages, tools);
    if (!response.toolCall) return { response: response.text, proposal: null };
    if (!input.serverId) unavailable("Select one of your connected servers before proposing a tool action");
    if (!tools.some((tool) => tool.name === response.toolCall?.name)) unavailable("The assistant proposed a tool that is not available on the selected server");
    const proposal = await createAssistantToolProposal(access, { serverId: input.serverId, toolName: response.toolCall.name, toolInput: response.toolCall.input });
    return { response: response.text, proposal: { ...proposal, serverName } };
  };
  const primary = await getAuthorizedAssistantProvider(access, input.provider);
  if (!primary) unavailable("Configure your own assistant provider key before starting a conversation");
  try {
    const result = await callProvider(primary);
    return { ...result, providerUsed: primary.provider, retryRequest: null };
  } catch (error) {
    if (!(error instanceof AssistantProviderLimitError)) throw error;
    const rateLimits = [error];
    for (const fallback of await listAuthorizedFallbackProviders(access, primary.provider)) {
      try {
        const result = await callProvider(fallback);
        return { ...result, providerUsed: fallback.provider, fallbackFrom: primary.provider, retryRequest: null };
      } catch (fallbackError) {
        if (fallbackError instanceof AssistantProviderLimitError) { rateLimits.push(fallbackError); continue; }
        throw fallbackError;
      }
    }
    const retry = await createAssistantRetryRequest(access, { sourceProvider: primary.provider, serverId: input.serverId, messages: input.messages });
    const retrySeconds = rateLimits.map((limit) => limit.retryAfterSeconds).filter((value): value is number => Boolean(value)).sort((a, b) => a - b)[0];
    return {
      response: "Every fallback provider you explicitly enabled is rate limited right now. No paid provider was touched. Tap the reset notification to retry this conversation when a real reset window is available.",
      proposal: null,
      providerUsed: primary.provider,
      retryRequest: { id: retry.id, expiresAt: retry.expiresAt, retryAt: retrySeconds ? new Date(Date.now() + retrySeconds * 1_000) : undefined },
    };
  }
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

  setProviderFallback: protectedProcedure.input(z.object({
    provider: z.enum(ASSISTANT_PROVIDERS),
    enabled: z.boolean(),
    priority: z.number().int().min(1).max(100),
  })).mutation(async ({ ctx, input }) => {
    try {
      return await setAssistantProviderFallback(await workspaceFor(ctx), input);
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "Provider fallback preference could not be saved");
    }
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
    try {
      return await runAssistantConversation(access, input);
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "The configured assistant provider is unavailable");
    }
  }),

  retryConversation: protectedProcedure.input(z.object({ retryRequestId: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const access = await workspaceFor(ctx);
    try {
      const retry = await consumeAssistantRetryRequest(access, input.retryRequestId);
      return await runAssistantConversation(access, { provider: retry.sourceProvider, serverId: retry.serverId, messages: retry.messages });
    } catch (error) {
      unavailable(error instanceof Error ? error.message : "The saved assistant retry is unavailable");
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
