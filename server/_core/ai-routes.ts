import { Express, Request, Response } from "express";

import { aiLimiter } from "./rate-limiter";
import { sdk } from "./sdk.js";
import { HttpError } from "../../shared/_core/errors.js";

function respondToLegacyAiError(error: unknown, res: Response) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(502).json({ error: "AI assistant is temporarily unavailable" });
}

/**
 * Legacy direct HTTP AI routes are intentionally unavailable. The active
 * assistant uses protected tRPC procedures, an encrypted user-selected
 * provider configuration, and explicit tool approval records.
 */
export function setupAIRoutes(app: Express): void {
  const unavailable = async (req: Request, res: Response) => {
    try {
      await sdk.authenticateRequest(req);
      res.status(410).json({ error: "Configure your own assistant provider in MCP Hub before starting a conversation" });
    } catch (error) {
      respondToLegacyAiError(error, res);
    }
  };

  app.post("/api/ai/chat", aiLimiter, unavailable);
  app.post("/api/ai/stream", aiLimiter, unavailable);
}
