## 2025-05-22 - [Secure CORS Policy and Security Headers]
**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.

## 2025-06-18 - [Missing Authentication on Sensitive tRPC Routers]
**Vulnerability:** Multiple sensitive tRPC routers (Tokens, Webhooks, Analytics) were defined using `publicProcedure`, which would allow unauthenticated access once registered in the main application router.
**Learning:** In a tRPC-based architecture, it is easy to default to `publicProcedure` when creating new routers. Security must be considered at the router definition level, especially for management and data-sensitive modules.
**Prevention:** Always use `protectedProcedure` or `adminProcedure` by default for new tRPC routers unless they are explicitly intended to be public. Implement security tests that verify authentication requirements for all registered routers.

## 2026-06-25 - [Insecure Default for Sensitive Feature Routers]
**Vulnerability:** New feature routers (Workflows and Templates) were initially defined using `publicProcedure`, which would have allowed unauthenticated access to sensitive management and execution logic once registered.
**Learning:** Developers often copy-paste from `publicProcedure` templates when starting new modules. Security must be part of the initial router registration process.
**Prevention:** Audit all tRPC routers for proper procedure types before registering them in the main `appRouter`. Use automated security tests to verify that sensitive endpoints require authentication.
