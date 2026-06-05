import { Readable } from "stream";

// Free models whitelist from OpenRouter
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-ultra:free",
  "google/glm-4-5-air:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "google/gemma-4-26b-a4b:free",
  "nvidia/nemo-3-nano-omni:free",
  "lmstudio/lfm2.5-1.2b-instruct:free",
  "gpt-oss-20b:free",
];

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantOptions {
  apiKey: string;
  userContext?: {
    currentScreen?: string;
    workflowData?: Record<string, unknown>;
    recentActions?: string[];
  };
}

/**
 * AI Assistant service using OpenRouter free models
 * Provides expert guidance on MCP, workflows, and app functionality
 */
export class AIAssistant {
  private apiKey: string;
  private baseURL = "https://openrouter.io/api/v1";
  private modelIndex = 0;
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(options: AIAssistantOptions) {
    this.apiKey = options.apiKey;
  }

  /**
   * Get the system prompt for the AI assistant
   */
  private getSystemPrompt(userContext?: AIAssistantOptions["userContext"]): string {
    let contextInfo = "";
    if (userContext) {
      if (userContext.currentScreen) {
        contextInfo += `\nUser is currently on: ${userContext.currentScreen}`;
      }
      if (userContext.recentActions?.length) {
        contextInfo += `\nRecent actions: ${userContext.recentActions.join(", ")}`;
      }
    }

    return `You are an expert AI assistant for MCP Hub, a workflow automation and integration platform built on Model Context Protocol (MCP).

Your expertise includes:
- Model Context Protocol (MCP) architecture, servers, and tools
- Creating and managing workflows in MCP Hub
- Connecting external services (GitHub, Slack, Notion, etc.) via MCP
- Troubleshooting common issues and errors
- Best practices for automation and integration
- General app navigation and features

You are helpful, concise, and direct. You provide practical solutions and explanations. When users ask for help:
1. Understand their problem or question
2. Provide clear, actionable steps
3. Explain why something works the way it does
4. Suggest best practices when relevant

Keep responses focused and avoid unnecessary verbosity. Use code examples when helpful.${contextInfo}`;
  }

  /**
   * Get the next model in the fallback chain
   */
  private getNextModel(): string {
    const model = FREE_MODELS[this.modelIndex % FREE_MODELS.length];
    this.modelIndex++;
    return model;
  }

  /**
   * Stream a chat response from OpenRouter
   */
  async streamChat(
    messages: AIMessage[],
    userContext?: AIAssistantOptions["userContext"]
  ): Promise<Readable> {
    const systemMessage = this.getSystemPrompt(userContext);

    // Create a readable stream to return
    const readable = new Readable({
      read() {
        // Stream implementation handled below
      },
    });

    // Start the request in the background
    this.makeStreamRequest(messages, systemMessage, readable).catch((err) => {
      readable.destroy(err);
    });

    return readable;
  }

  /**
   * Make streaming request to OpenRouter with fallback logic
   */
  private async makeStreamRequest(
    messages: AIMessage[],
    systemMessage: string,
    readable: Readable
  ): Promise<void> {
    let lastError: Error | null = null;

    // Try each model in the fallback chain
    for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
      try {
        const model = this.getNextModel();

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mcphub.app",
            "X-Title": "MCP Hub AI Assistant",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemMessage },
              ...messages,
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        if (!response.body) {
          throw new Error("No response body from OpenRouter");
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  readable.push(null); // End stream
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    readable.push(content);
                  }
                } catch {
                  // Ignore parse errors for malformed JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return; // Success, exit retry loop
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[ai-assistant] Model attempt ${attempt + 1} failed:`, lastError.message);
        // Continue to next model
      }
    }

    // All models failed
    const errorMsg = `All AI models failed. Last error: ${lastError?.message || "Unknown error"}`;
    readable.destroy(new Error(errorMsg));
  }

  /**
   * Get a non-streaming response (for simpler use cases)
   */
  async getResponse(
    messages: AIMessage[],
    userContext?: AIAssistantOptions["userContext"]
  ): Promise<string> {
    const systemMessage = this.getSystemPrompt(userContext);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
      try {
        const model = this.getNextModel();

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://mcphub.app",
            "X-Title": "MCP Hub AI Assistant",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemMessage },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response generated";
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[ai-assistant] Model attempt ${attempt + 1} failed:`, lastError.message);
      }
    }

    throw new Error(`All AI models failed. Last error: ${lastError?.message || "Unknown error"}`);
  }
}

/**
 * Create and return a singleton AI Assistant instance
 */
let assistantInstance: AIAssistant | null = null;

export function getAIAssistant(): AIAssistant {
  if (!assistantInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    assistantInstance = new AIAssistant({ apiKey });
  }
  return assistantInstance;
}
