import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate Limiting Configuration
 * Protects API endpoints from abuse and ensures fair usage
 */

// Global rate limiter - applies to all requests
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// API endpoint rate limiter - for tRPC and REST endpoints
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many API requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// AI requests create upstream model work and need a lower allowance than normal API calls.
export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many AI requests, please try again shortly.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Workflow execution rate limiter - stricter for resource-intensive operations
export const workflowLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 workflow executions per minute
  message: "Too many workflow executions, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: "Too many file uploads, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter for specific endpoints
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum requests per window
 * @param message - Error message
 */
export function createCustomLimiter(
  windowMs: number,
  max: number,
  message: string
) {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Rate limiter handler that returns JSON response
 * Useful for API endpoints that expect JSON responses
 */
export const jsonErrorHandler = (
  req: Request,
  res: Response,
  next: Function
) => {
  // Check if rate limit was exceeded
  if (res.statusCode === 429) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: res.getHeader("Retry-After"),
    });
  }
  next();
};
