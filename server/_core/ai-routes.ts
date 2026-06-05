import { Express, Request, Response } from "express";
import { getAIAssistant } from "./ai-assistant.js";

export function setupAIRoutes(app: Express): void {
  /**
   * POST /api/ai/chat
   * Get a non-streaming response from the AI assistant
   */
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    try {
      const { messages, context } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      const assistant = getAIAssistant();
      const response = await assistant.getResponse(messages, context);

      res.json({ response });
    } catch (err) {
      console.error("[ai-routes] Chat error:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Failed to get AI response",
      });
    }
  });

  /**
   * POST /api/ai/stream
   * Stream a response from the AI assistant
   */
  app.post("/api/ai/stream", async (req: Request, res: Response) => {
    try {
      const { messages, context } = req.body;

      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      const assistant = getAIAssistant();
      const stream = await assistant.streamChat(messages, context);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      stream.pipe(res);

      stream.on("error", (err) => {
        console.error("[ai-routes] Stream error:", err);
        res.status(500).json({ error: "Stream failed" });
      });
    } catch (err) {
      console.error("[ai-routes] Stream setup error:", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : "Failed to start stream",
      });
    }
  });

  console.log("[ai-routes] AI Assistant routes configured");
}
