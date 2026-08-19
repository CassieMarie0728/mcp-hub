import type { MCPTool } from "../mcp/mcp-server-manager";
import type { AuthorizedAssistantProvider } from "./assistant-repository";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type ProviderToolCall = {
  name: string;
  input: Record<string, unknown>;
};

export type ProviderAssistantResponse = {
  text: string;
  toolCall?: ProviderToolCall;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Assistant provider returned invalid tool input");
  }
  return value as Record<string, unknown>;
}

function buildTools(tools: MCPTool[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description.slice(0, 1_000),
      parameters: tool.inputSchema,
    },
  }));
}

export async function askConfiguredFreeProvider(
  provider: AuthorizedAssistantProvider,
  messages: AssistantMessage[],
  tools: MCPTool[],
): Promise<ProviderAssistantResponse> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://mcphub-cah4bw3p.manus.space",
      "X-Title": "MCP Hub Assistant",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        {
          role: "system",
          content: "You are MCP Hub's careful assistant. You may explain, or propose at most one available tool call when the user explicitly asks for an action. Never claim an action executed. Tool calls require a separate user approval step.",
        },
        ...messages,
      ],
      tools: tools.length > 0 ? buildTools(tools) : undefined,
      tool_choice: tools.length > 0 ? "auto" : "none",
      temperature: 0.2,
      max_tokens: 1_000,
    }),
  });
  if (!response.ok) throw new Error("The configured assistant provider is unavailable");

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }>;
  };
  const message = payload.choices?.[0]?.message;
  if (!message) throw new Error("The configured assistant provider returned no response");
  const toolCall = message.tool_calls?.[0]?.function;
  if (!toolCall?.name) return { text: message.content?.trim() || "I could not produce a response." };

  let input: Record<string, unknown>;
  try {
    input = asRecord(JSON.parse(toolCall.arguments ?? "{}"));
  } catch {
    throw new Error("The assistant proposed invalid tool input");
  }
  return { text: message.content?.trim() || "I can prepare that action for your approval.", toolCall: { name: toolCall.name, input } };
}
