import type { MCPTool } from "../mcp/mcp-server-manager";
import type { AssistantProviderId, AuthorizedAssistantProvider } from "./assistant-repository";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const SYSTEM_PROMPT = "You are MCP Hub's careful assistant. You may explain, or propose at most one available tool call when the user explicitly asks for an action. Never claim an action executed. Tool calls require a separate user approval step.";

export type AssistantMessage = { role: "user" | "assistant"; content: string };
export type ProviderToolCall = { name: string; input: Record<string, unknown> };
export type ProviderAssistantResponse = { text: string; toolCall?: ProviderToolCall };

export class AssistantProviderLimitError extends Error {
  constructor(public readonly provider: AssistantProviderId, public readonly retryAfterSeconds?: number) {
    super(`${providerLabel(provider)}'s free-tier goblin hit the snack limit. ${retryAfterSeconds ? `Give it about ${retryAfterSeconds}s,` : "Give it a breather,"} trim the prompt, or check your provider dashboard. No paid fallback was used.`);
  }
}
function providerLabel(provider: AssistantProviderId) { return ({ openrouter: "OpenRouter", gemini: "Gemini", groq: "Groq", mistral: "Mistral" })[provider]; }
function asRecord(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Assistant provider returned invalid tool input"); return value as Record<string, unknown>; }
function buildOpenAITools(tools: MCPTool[]) { return tools.map((tool) => ({ type: "function" as const, function: { name: tool.name, description: tool.description.slice(0, 1_000), parameters: tool.inputSchema } })); }
function retryAfter(response: Response) { const value = Number(response.headers.get("retry-after")); return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined; }
async function ensureSuccess(provider: AssistantProviderId, response: Response) { if (response.ok) return; if (response.status === 429) throw new AssistantProviderLimitError(provider, retryAfter(response)); if (response.status === 401 || response.status === 403) throw new Error(`${providerLabel(provider)} rejected this API key. Check the key and provider account permissions.`); throw new Error(`${providerLabel(provider)} is unavailable right now. The app did not try another provider behind your back.`); }
function parseOpenAIResponse(payload: { choices?: Array<{ message?: { content?: string | null; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }> }): ProviderAssistantResponse { const message = payload.choices?.[0]?.message; if (!message) throw new Error("The configured assistant provider returned no response"); const call = message.tool_calls?.[0]?.function; if (!call?.name) return { text: message.content?.trim() || "I could not produce a response." }; let input: Record<string, unknown>; try { input = asRecord(JSON.parse(call.arguments ?? "{}")); } catch { throw new Error("The assistant proposed invalid tool input"); } return { text: message.content?.trim() || "I can prepare that action for your approval.", toolCall: { name: call.name, input } }; }
async function askOpenAICompatible(provider: AssistantProviderId, url: string, apiKey: string, model: string, messages: AssistantMessage[], tools: MCPTool[], extraHeaders: Record<string, string> = {}) {
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...extraHeaders }, body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages], tools: tools.length ? buildOpenAITools(tools) : undefined, tool_choice: tools.length ? "auto" : "none", temperature: 0.2, max_tokens: 1_000 }) });
  await ensureSuccess(provider, response); return parseOpenAIResponse(await response.json() as Parameters<typeof parseOpenAIResponse>[0]);
}
async function askGemini(provider: AuthorizedAssistantProvider, messages: AssistantMessage[], tools: MCPTool[]): Promise<ProviderAssistantResponse> {
  const response = await fetch(`${GEMINI_URL}/${encodeURIComponent(provider.model)}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": provider.apiKey }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: messages.map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })), tools: tools.length ? [{ functionDeclarations: tools.map((tool) => ({ name: tool.name, description: tool.description.slice(0, 1_000), parameters: tool.inputSchema })) }] : undefined, generationConfig: { temperature: 0.2, maxOutputTokens: 1_000 } }) });
  await ensureSuccess("gemini", response); const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; functionCall?: { name?: string; args?: unknown } }> } }> }; const parts = payload.candidates?.[0]?.content?.parts ?? []; const call = parts.find((part) => part.functionCall)?.functionCall; const text = parts.map((part) => part.text ?? "").join(" ").trim(); if (!call?.name) return { text: text || "I could not produce a response." }; return { text: text || "I can prepare that action for your approval.", toolCall: { name: call.name, input: asRecord(call.args ?? {}) } };
}
export async function askConfiguredAssistantProvider(provider: AuthorizedAssistantProvider, messages: AssistantMessage[], tools: MCPTool[]): Promise<ProviderAssistantResponse> {
  if (provider.provider === "gemini") return askGemini(provider, messages, tools);
  if (provider.provider === "groq") return askOpenAICompatible("groq", GROQ_URL, provider.apiKey, provider.model, messages, tools);
  if (provider.provider === "mistral") return askOpenAICompatible("mistral", MISTRAL_URL, provider.apiKey, provider.model, messages, tools);
  return askOpenAICompatible("openrouter", OPENROUTER_URL, provider.apiKey, provider.model, messages, tools, { "HTTP-Referer": "https://mcphub-cah4bw3p.manus.space", "X-Title": "MCP Hub Assistant" });
}
