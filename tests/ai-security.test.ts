import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sdk } from '../server/_core/sdk';
import { setupAIRoutes } from '../server/_core/ai-routes';
import { ForbiddenError } from '../shared/_core/errors';
import express, { Express, Request, Response } from 'express';

vi.mock('../server/_core/sdk', () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

describe('AI Assistant Security', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    setupAIRoutes(app);
  });

  it('should return 403 when authentication fails for /api/ai/chat', async () => {
    const mockReq = {
      body: { messages: [{ role: 'user', content: 'hi' }] },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockRejectedValue(ForbiddenError('Invalid session cookie'));

    // Find the handler for /api/ai/chat
    const chatRoute = app._router.stack.find((layer: any) => layer.route?.path === '/api/ai/chat');
    const chatHandler = chatRoute.route.stack[0].handle;

    await chatHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid session cookie' });
  });

  it('should return 403 when authentication fails for /api/ai/stream', async () => {
    const mockReq = {
      body: { messages: [{ role: 'user', content: 'hi' }] },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockRejectedValue(ForbiddenError('Invalid session cookie'));

    // Find the handler for /api/ai/stream
    const streamRoute = app._router.stack.find(
      (layer: any) => layer.route?.path === '/api/ai/stream',
    );
    const streamHandler = streamRoute.route.stack[0].handle;

    await streamHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid session cookie' });
  });
});
