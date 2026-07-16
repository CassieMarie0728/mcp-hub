## 2025-05-22 - [Secure CORS Policy and Security Headers]

**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.

## 2025-06-18 - [Missing Authentication on Sensitive tRPC Routers]

**Vulnerability:** Multiple sensitive tRPC routers (Tokens, Webhooks, Analytics) were defined using `publicProcedure`, which would allow unauthenticated access once registered in the main application router.
**Learning:** In a tRPC-based architecture, it is easy to default to `publicProcedure` when creating new routers. Security must be considered at the router definition level, especially for management and data-sensitive modules.
**Prevention:** Always use `protectedProcedure` or `adminProcedure` by default for new tRPC routers unless they are explicitly intended to be public. Implement security tests that verify authentication requirements for all registered routers.

## 2025-07-02 - [Credential Leakage in MCP Router]

**Vulnerability:** The `mcp.getServer` and `mcp.getAllServers` procedures were returning full `MCPServerConfig` objects, which included sensitive authentication credentials like tokens and passwords.
**Learning:** It is easy to accidentally leak sensitive information when returning raw internal state objects through an API. Even `protectedProcedure` endpoints should not expose more information than necessary to the client.
**Prevention:** Implement redaction helpers or use specific Response types/Zod schemas to ensure sensitive fields are never sent to the client.
