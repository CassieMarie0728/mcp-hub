import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { mcpRouter } from "./mcp/mcp-router";
import { mcpExtendedRouter } from "./mcp/mcp-router-extended";
import { tokenRouter } from "./tokens/token-router";
import { webhooksRouter } from "./webhooks/webhooks-router";
import { analyticsRouter } from "./analytics/analytics-router";
import { oauthRouter } from "./auth/oauth-router";
import { workflowsProcedures } from "./procedures/workflows";
import { templatesRouter } from "./templates/templates-router";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  oauth: oauthRouter,
  mcp: mcpRouter,
  mcpServers: mcpExtendedRouter,
  tokens: tokenRouter,
  webhooks: webhooksRouter,
  analytics: analyticsRouter,
  workflows: workflowsProcedures,
  templates: templatesRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
