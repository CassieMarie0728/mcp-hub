# AI Agent Instructions for MCP Hub

<!-- moxie-docs:start -->
## Moxie Docs Agent Guidance

Use the Moxie Docs MCP server before editing CassieMarie0728/mcp-hub. Load conventions, documentation patterns, documentation gaps, documentation update opportunities, and verified commands before changing code.

When your Moxie Docs token serves more than one repository, pass `repository: "CassieMarie0728/mcp-hub"` in every Moxie tool call from this repo so the context targets CassieMarie0728/mcp-hub.

### Documentation expectation

- Update human-readable docs when a change alters behavior, APIs, workflows, architecture, operational runbooks, or setup paths.
- Follow the repository's detected documentation placement and style.
- Prefer small source-cited docs updates over broad rewrites.
- Avoid filler docs that only restate file names, component names, or code that is already obvious.
- When you edit an existing doc, scan the whole file and correct any other section your change makes stale or wrong — don't leave known-outdated content next to a fresh update.

<!-- moxie-docs:end -->

## Technology Stack

**Frontend:** React Native 0.81 + Expo SDK 54, Expo Router for file-based routing, TypeScript 5.9, Tailwind CSS 3 with NativeWind 4, React Query 5
**Backend:** Node.js/Express, tRPC 11, TypeScript 5.9
**Database:** Drizzle ORM 0.45 with MySQL-compatible databases
**Testing:** Vitest 4 (in `__tests__/` and `lib/__tests__/`)
**Package Manager:** pnpm 9.12+
**Build:** esbuild for server bundle, Expo for mobile/web

## Directory Structure

- `app/` — Expo Router screens and layouts (file-system routing)
- `components/` — Reusable React Native components
- `lib/` — Shared utilities, hooks, types, models, and engines
  - `hooks/` — Custom React hooks for MCP, macros, execution, discovery
  - `models/` — Data models (Macro, ExecutionHistory, ServerPreset)
  - `types/` — Type definitions (MCPServer, MCPTool, ToolExecutionResult)
  - `_core/` — Low-level utilities and NativeWind integration
- `server/` — Express backend, tRPC routers, and procedures
  - `_core/` — Server initialization, middleware, context, authentication
  - `mcp/` — MCP server management (routers, registry, server manager)
  - `routers.ts` — Main tRPC router composition
- `server/procedures/` — Business logic for tRPC mutations/queries
- `shared/` — Shared constants and utilities
- `drizzle/` — Database schema (Drizzle ORM)
- `__tests__/` — Integration and feature tests (Vitest)
- `kubernetes/` — Kubernetes manifests for deployment

## Development Workflow

### Start development:
```bash
pnpm install
cp .env.example .env
pnpm db:push        # Apply Drizzle migrations
pnpm dev            # Run backend watcher + Expo web in parallel
```

### Common commands:
- `pnpm dev:server` — Start backend watcher only (tsx watch)
- `pnpm dev:metro` — Start Expo web server only
- `pnpm check` — Type-check with TypeScript
- `pnpm lint` — Run ESLint (Expo config + recommended)
- `pnpm format` — Run Prettier (100-column width, single quotes, trailing commas)
- `pnpm test` — Run Vitest suite
- `pnpm build` — Build server bundle with esbuild
- `pnpm android` / `pnpm ios` — Run on device/emulator

## Code Organization & Patterns

### tRPC Routers & Procedures
- **Location:** `server/routers.ts` composes the main app router
- **Pattern:** Use `protectedProcedure` for authenticated endpoints, `publicProcedure` for public
- **Input validation:** Use Zod schemas (e.g., `MCPServerConfigSchema`)
- **Context:** Available via `ctx` parameter, includes user, request, response
- Example from `server/mcp/mcp-router.ts`:
  ```typescript
  export const mcpRouter = router({
    registerServer: protectedProcedure
      .input(MCPServerConfigSchema)
      .mutation(({ input }) => { /* logic */ }),
  });
  ```

### Frontend Components & Screens
- **File-based routing:** Routes map directly from `app/` directory structure
- **Layout nesting:** `_layout.tsx` files define UI nesting and navigation
- **Styling:** Use Tailwind utility classes with NativeWind (`className="...")
- **Type safety:** Extend component props with proper TypeScript interfaces

### Hooks & State Management
- **Location:** `lib/hooks/` and `hooks/` directories
- **Patterns:** React hooks for MCP server connection, macro execution, tool discovery
- **Examples:** `useMCPBridge()`, `useMacroExecution()`, `useExecutionHistory()`
- **Data fetching:** Use React Query via tRPC client for caching and synchronization

### Database & Schema
- **Schema location:** `drizzle/schema.ts`
- **Workflow:** Update schema → `pnpm db:push` → test locally → commit
- **ORM:** Use Drizzle for type-safe queries and migrations
- **Migration command:** `drizzle-kit generate && drizzle-kit migrate`

### Type Safety & Validation
- **TypeScript config:** Strict mode enabled in `tsconfig.json`
- **Input validation:** All tRPC procedures use Zod schemas
- **Path aliases:** `@/*` maps to workspace root, `@shared/*` maps to `shared/`

### Testing
- **Location:** Tests live in `__tests__/` at project root and `lib/__tests__/`
- **Configuration:** `vitest.config.ts` includes `__tests__/**/*.test.ts` pattern
- **Framework:** Vitest (compatible with Jest API)
- **Pattern:** Use `describe`, `it`, `beforeEach`, `vi` for mocking
- **Example test file:** `__tests__/integration.test.ts` shows E2E workflow testing

### Error Handling & Logging
- **Logger:** Winston for structured logging (imported as needed)
- **Rate limiting:** `express-rate-limit` middleware applied via `globalLimiter` and `apiLimiter`
- **Security headers:** CORS, X-Frame-Options, CSP headers set in server entry

## Key Files to Know

- `server/_core/index.ts` — Server initialization, middleware setup, port discovery
- `server/routers.ts` — Main tRPC router composition
- `app/_layout.tsx` — Root layout with tRPC provider, theme, and safe area setup
- `lib/trpc.ts` — tRPC client configuration for frontend
- `lib/types.ts` — Core types (MCPServer, MCPTool, ToolExecutionResult)
- `.env.example` — Defines required environment variables (copy to `.env`)
- `.prettierrc` — Formatting rules (semicolons, single quotes, 100-column width)
- `.eslintrc` — ESLint config (extends Expo rules + eslint:recommended)

## Commit & PR Conventions

- **Commit format:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)
- **Branch naming:** `feature/`, `fix/`, `docs/`, `chore/` prefixes
- **PR checklist:** Run `pnpm check`, `pnpm lint`, `pnpm test` before opening PR
- **Schema changes:** Also run `pnpm db:push` and verify migrations
- **Documentation:** Update relevant docs when behavior, API, or setup changes

## Known Integrations & External Dependencies

- **Expo Router:** File-based routing for mobile/web navigation
- **tRPC:** Type-safe API layer between frontend and backend
- **Drizzle ORM:** Database abstraction and migrations
- **React Query:** Data fetching and cache management
- **Zod:** Schema validation and type inference
- **Socket.io:** WebSocket support for real-time features
- **OAuth:** GitHub, Slack, Notion integrations (see `server/_core/oauth.ts`)
- **MCP Servers:** External tool servers connected via stdio, HTTP, WebSocket transports

## Important Caveats

- Strict TypeScript mode is enabled; do not disable without strong justification
- Database changes require `pnpm db:push` before commit
- Tests must pass before PR merge (refer to `pnpm test`)
- Documentation should reflect repository code, not aspirational architecture
- Preserve existing project structure unless refactoring is explicitly scoped
