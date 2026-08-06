import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sdk } from '../server/_core/sdk';
import marketplaceRouter from '../server/routes/marketplace';
import { ForbiddenError } from '../shared/_core/errors';
import type { Request, Response } from 'express';

vi.mock('../server/_core/sdk', () => ({
  sdk: {
    authenticateRequest: vi.fn(),
  },
}));

describe('Marketplace Router Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403/401 when authentication fails for POST /macros/:id/download', async () => {
    const mockReq = {
      params: { id: '1' },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockRejectedValue(ForbiddenError('Invalid session cookie'));

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/download',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Invalid session cookie' });
  });

  it('should return 403/401 when authentication fails for POST /macros/:id/reviews', async () => {
    const mockReq = {
      params: { id: '1' },
      body: { rating: 5, comment: 'Great macro!' },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockRejectedValue(ForbiddenError('Invalid session cookie'));

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/reviews',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Invalid session cookie' });
  });

  it('should successfully download macro when authenticated', async () => {
    const mockReq = {
      params: { id: '1' },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: 'test-user-openid',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    } as any);

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/download',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Macro downloaded successfully',
      macroId: '1',
      userId: 'test-user-openid',
    });
  });

  it('should reject invalid rating for reviews', async () => {
    const mockReq = {
      params: { id: '1' },
      body: { rating: 6, comment: 'Too high rating' },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: 'test-user-openid',
    } as any);

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/reviews',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('rating'),
      }),
    );
  });

  it('should reject extremely long comments for reviews', async () => {
    const mockReq = {
      params: { id: '1' },
      body: { rating: 5, comment: 'a'.repeat(501) },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: 'test-user-openid',
    } as any);

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/reviews',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('long'),
      }),
    );
  });

  it('should sanitize comment and prevent XSS', async () => {
    const mockReq = {
      params: { id: '1' },
      body: { rating: 5, comment: "<script>alert('xss')</script>" },
      headers: {},
    } as unknown as Request;

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    vi.mocked(sdk.authenticateRequest).mockResolvedValue({
      id: 1,
      openId: 'test-user-openid',
    } as any);

    const route = marketplaceRouter.stack.find(
      (layer: any) => layer.route?.path === '/macros/:id/reviews',
    );
    const handler = route.route.stack[0].handle;

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Review added successfully',
      review: {
        id: 'new-review',
        macroId: '1',
        rating: 5,
        comment: '&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;',
      },
    });
  });
});
