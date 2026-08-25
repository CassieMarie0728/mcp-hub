import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import net from 'net';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { registerOAuthRoutes } from './oauth';
import { appRouter } from '../routers';
import { createContext } from './context';
import path from 'path';
import { fileURLToPath } from 'url';
import { globalLimiter, apiLimiter } from './rate-limiter';
import { setupAIRoutes } from './ai-routes.js';
import marketplaceRouter from '../routes/marketplace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS with origin validation and add security headers
  app.use((req, res, next) => {
    const origin = req.headers.origin as string;
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:3000',
      process.env.EXPO_WEB_PREVIEW_URL,
      process.env.EXPO_PACKAGER_PROXY_URL,
    ].filter(Boolean) as string[];

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    res.header('Access-Control-Allow-Credentials', 'true');

    // Standard Security Headers
    res.header('X-Frame-Options', 'DENY');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Apply global rate limiter to all requests
  app.use(globalLimiter);

<<<<<<< HEAD
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
=======
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
>>>>>>> origin/main

  // Serve landing page at root
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../landing/index.html'));
  });

  // Serve landing assets (CSS, JS, images, demos)
  app.use(express.static(path.join(__dirname, '../../landing')));

  registerOAuthRoutes(app);
  setupAIRoutes(app);
  app.use('/api', marketplaceRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: Date.now(), version: '1.0.0' });
  });

  // Apply API rate limiter to tRPC endpoint
  app.use('/api/trpc', apiLimiter);

  app.use(
    '/api/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || '3000');
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    console.log(`[landing] available at http://localhost:${port}`);
    console.log(`[demos] available at http://localhost:${port}/demo-*.html`);
    console.log(`[rate-limiting] Global: 1000 req/15min | API: 100 req/1min`);
  });
}

startServer().catch(console.error);
