import { Express, Request, Response } from "express";
import { z } from "zod";
import { getAIAssistant } from "./ai-assistant.js";
import { aiLimiter } from "./rate-limiter";
import { sdk } from "./sdk.js";
import { HttpError } from "../../shared/_core/errors.js";

const aiRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(8_000),
  })).min(1).max(32),
  context: z.object({
    currentScreen: z.string().trim().max(120).optional(),
    recentActions: z.array(z.string().trim().min(1).max(240)).max(20).optional(),
  }).optional(),
});

function parseAiRequest(body: unknown) {
  const parsed = aiRequestSchema.safeParse(body);
  if (!parsed.success) return null;
  return parsed.data;
}

function respondToAiRouteError(err: unknown, res: Response, operation: "chat" | "stream") {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error(`[ai-routes] ${operation} error:`, err);
  res.status(502).json({ error: "AI assistant is temporarily unavailable" });
}

export function setupAIRoutes(app: Express): void {
  /**
   * POST /api/ai/chat
   * Get a non-streaming response from the AI assistant
   */
  app.post("/api/ai/chat", aiLimiter, async (req: Request, res: Response) => {
    try {
      // Authenticate user before processing request to prevent unauthorized OpenRouter API usage
      await sdk.authenticateRequest(req);

      const input = parseAiRequest(req.body);
      if (!input) {
        res.status(400).json({ error: "Invalid AI assistant request" });
        return;
      }

      const assistant = getAIAssistant();
      const response = await assistant.getResponse(input.messages, input.context);

      res.json({ response });
    } catch (err) {
      respondToAiRouteError(err, res, "chat");
    }
  });

  /**
   * POST /api/ai/stream
   * Stream a response from the AI assistant
   */
  app.post("/api/ai/stream", aiLimiter, async (req: Request, res: Response) => {
    try {
      // Authenticate user before processing request to prevent unauthorized OpenRouter API usage
      await sdk.authenticateRequest(req);

      const input = parseAiRequest(req.body);
      if (!input) {
        res.status(400).json({ error: "Invalid AI assistant request" });
        return;
      }

      const assistant = getAIAssistant();
      const controller = new AbortController();
      const abortStream = () => {
        controller.abort();
        stream.destroy();
      };
      const stream = await assistant.streamChat(input.messages, input.context, controller.signal);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      stream.pipe(res);

      req.once("aborted", abortStream);
      res.once("close", abortStream);

      stream.on("error", (err) => {
        console.error("[ai-routes] Stream error:", err);
        if (!res.headersSent) {
          res.status(502).json({ error: "AI assistant stream failed" });
        } else {
          res.end();
        }
      });
    } catch (err) {
      respondToAiRouteError(err, res, "stream");
    }
  });

  console.log("[ai-routes] AI Assistant routes configured");
}
