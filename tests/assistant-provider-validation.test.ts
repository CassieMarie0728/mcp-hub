import { describe, expect, it } from "vitest";

import { AssistantProviderLimitError } from "../server/assistant/assistant-provider-client";
import { validateAssistantProviderModel } from "../server/assistant/assistant-repository";

describe("assistant provider validation", () => {
  it("accepts explicit OpenRouter free models and only allowlisted provider models", () => {
    expect(validateAssistantProviderModel("openrouter", "meta-llama/llama-3.3-70b-instruct:free")).toBe("meta-llama/llama-3.3-70b-instruct:free");
    expect(validateAssistantProviderModel("gemini", "gemini-3.7-flash")).toBe("gemini-3.7-flash");
    expect(validateAssistantProviderModel("groq", "openai/gpt-oss-20b")).toBe("openai/gpt-oss-20b");
    expect(validateAssistantProviderModel("mistral", "mistral-small-latest")).toBe("mistral-small-latest");
  });

  it("denies non-free OpenRouter models and arbitrary model names for managed providers", () => {
    expect(() => validateAssistantProviderModel("openrouter", "anthropic/claude-3.5-sonnet")).toThrow(":free");
    expect(() => validateAssistantProviderModel("gemini", "gemini-pro-that-may-cost-money")).toThrow("paid fallback");
    expect(() => validateAssistantProviderModel("groq", "someone-elses-model")).toThrow("paid fallback");
    expect(() => validateAssistantProviderModel("mistral", "mistral-large-latest")).toThrow("paid fallback");
  });

  it("gives rate-limited users a playful provider-specific wait message and promises no paid fallback", () => {
    const error = new AssistantProviderLimitError("groq", 42);
    expect(error.message).toContain("Groq");
    expect(error.message).toContain("free-tier goblin hit the snack limit");
    expect(error.message).toContain("42s");
    expect(error.message).toContain("No paid fallback was used");
  });
});
