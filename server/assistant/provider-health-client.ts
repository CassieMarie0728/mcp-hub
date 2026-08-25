import type { AssistantProviderId, AuthorizedAssistantProvider, ProviderHealthSource, ProviderHealthStatus } from "./assistant-repository";

const OPENROUTER_KEY_URL = "https://openrouter.ai/api/v1/key";
const GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";
const GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MISTRAL_MODELS_URL = "https://api.mistral.ai/v1/models";

export type ProviderHealthCheck = {
  provider: AssistantProviderId;
  status: ProviderHealthStatus;
  remainingRequests: number | null;
  remainingTokens: number | null;
  remainingCredit: string | null;
  resetAt: Date | null;
  source: ProviderHealthSource;
  message: string;
};

function numberHeader(response: Response, header: string): number | null {
  const value = Number(response.headers.get(header));
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function parseDurationMs(value: string | null): number | null {
  if (!value) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) return numeric * 1_000;
  let matched = false;
  let total = 0;
  for (const [, amount, unit] of value.matchAll(/(\d+(?:\.\d+)?)\s*([hms])/gi)) {
    matched = true;
    total += Number(amount) * (unit.toLowerCase() === "h" ? 3_600_000 : unit.toLowerCase() === "m" ? 60_000 : 1_000);
  }
  return matched && Number.isFinite(total) ? Math.ceil(total) : null;
}

function resetFromResponse(response: Response): Date | null {
  const retryAfter = response.headers.get("retry-after");
  const duration = parseDurationMs(retryAfter);
  if (duration !== null) return new Date(Date.now() + duration);
  if (retryAfter) {
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date) && date > Date.now()) return new Date(date);
  }
  const reset = parseDurationMs(response.headers.get("x-ratelimit-reset-requests"));
  return reset === null ? null : new Date(Date.now() + reset);
}

function resultForResponse(provider: AssistantProviderId, response: Response, source: ProviderHealthSource, remainingCredit: string | null = null): ProviderHealthCheck {
  const remainingRequests = numberHeader(response, "x-ratelimit-remaining-requests");
  const remainingTokens = numberHeader(response, "x-ratelimit-remaining-tokens");
  const resetAt = resetFromResponse(response);
  if (response.ok) return {
    provider, status: "valid", remainingRequests, remainingTokens, remainingCredit, resetAt, source,
    message: `${providerLabel(provider)} key verified. No secret was exposed.`,
  };
  if (response.status === 401 || response.status === 403) return {
    provider, status: "invalid", remainingRequests: null, remainingTokens: null, remainingCredit: null, resetAt: null, source: "none",
    message: `${providerLabel(provider)} rejected this key. The key goblin says: check it, replace it, try again.`,
  };
  if (response.status === 429) return {
    provider, status: "rate_limited", remainingRequests, remainingTokens, remainingCredit, resetAt, source,
    message: `${providerLabel(provider)} says the free-tier goblin hit the snack limit. ${resetAt ? "A reset time was returned, so you can opt in to a device alert." : "No trustworthy reset time was returned, so no fake alert was scheduled."}`,
  };
  return {
    provider, status: "unavailable", remainingRequests: null, remainingTokens: null, remainingCredit: null, resetAt: null, source: "none",
    message: `${providerLabel(provider)} could not be verified right now. Nothing else was tried behind your back.`,
  };
}

function providerLabel(provider: AssistantProviderId) { return ({ openrouter: "OpenRouter", gemini: "Gemini", groq: "Groq", mistral: "Mistral" })[provider]; }

function asCredit(value: unknown): string | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const normalized = String(value).trim();
  return normalized.length > 0 && normalized.length <= 64 ? normalized : null;
}

function asOpenRouterReset(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 1_000_000_000_000 ? value : value * 1_000;
    return timestamp > Date.now() ? new Date(timestamp) : null;
  }
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) || timestamp <= Date.now() ? null : new Date(timestamp);
  }
  return null;
}

export async function testAssistantProviderKey(provider: AuthorizedAssistantProvider): Promise<ProviderHealthCheck> {
  if (provider.provider === "openrouter") {
    const response = await fetch(OPENROUTER_KEY_URL, { headers: { Authorization: `Bearer ${provider.apiKey}` } });
    if (!response.ok) return resultForResponse("openrouter", response, "openrouter_key");
    const payload = await response.json() as { data?: { limit_remaining?: unknown; limit_reset?: unknown }; limit_remaining?: unknown; limit_reset?: unknown };
    const data = payload.data ?? payload;
    return {
      ...resultForResponse("openrouter", response, "openrouter_key", asCredit(data.limit_remaining)),
      remainingCredit: asCredit(data.limit_remaining), resetAt: asOpenRouterReset(data.limit_reset),
    };
  }
  if (provider.provider === "groq") {
    const response = await fetch(GROQ_MODELS_URL, { headers: { Authorization: `Bearer ${provider.apiKey}` } });
    return resultForResponse("groq", response, "response_headers");
  }
  if (provider.provider === "gemini") {
    const response = await fetch(GEMINI_MODELS_URL, { headers: { "x-goog-api-key": provider.apiKey } });
    return resultForResponse("gemini", response, "none");
  }
  const response = await fetch(MISTRAL_MODELS_URL, { headers: { Authorization: `Bearer ${provider.apiKey}` } });
  return resultForResponse("mistral", response, "none");
}
