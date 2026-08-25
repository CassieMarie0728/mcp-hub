<<<<<<< HEAD
## 2025-05-22 - [Secure CORS Policy and Security Headers]
**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.

## 2025-06-18 - [Missing Authentication on Sensitive tRPC Routers]
**Vulnerability:** Multiple sensitive tRPC routers (Tokens, Webhooks, Analytics) were defined using `publicProcedure`, which would allow unauthenticated access once registered in the main application router.
**Learning:** In a tRPC-based architecture, it is easy to default to `publicProcedure` when creating new routers. Security must be considered at the router definition level, especially for management and data-sensitive modules.
**Prevention:** Always use `protectedProcedure` or `adminProcedure` by default for new tRPC routers unless they are explicitly intended to be public. Implement security tests that verify authentication requirements for all registered routers.

## 2025-06-25 - [Redaction of Sensitive MCP Server Configs]
**Vulnerability:** The MCP router `getServer` and `getAllServers` endpoints were exposing raw, sensitive credentials (including Bearer tokens, passwords, and sensitive API headers) directly to authenticated clients. The API documentation claimed these fields were redacted, but the actual implementation returned raw database configurations.
**Learning:** Documented features regarding credential safety must be explicitly implemented and tested at the router level. Even with authenticated contexts (`protectedProcedure`), exposure of cleartext passwords and keys poses a credential leakage hazard if user accounts or client sessions are compromised.
**Prevention:** Always implement data redaction (`redactServerConfig` helper) to mask credentials before returning server configuration objects from the backend, and write automated tests to enforce this behavior on all registry-based endpoints.

## 2025-06-26 - [Securing Macro Marketplace API Routes]
**Vulnerability:** The Marketplace Express router was unmounted and lacked critical input validation, sanitization, and user authentication on endpoints that modify data (download macros, post reviews). This left the system vulnerable to spam reviews, XSS attacks, resource consumption via unvalidated limit bounds, and unauthenticated API enumeration.
**Learning:** Any Express route handler that reads or writes data should explicitly validate and sanitize user-provided data. Endpoints recording user downloads or reviews must enforce request authentication to prevent identity spoofing.
**Prevention:** Authenticate endpoints using `sdk.authenticateRequest(req)`, define robust sanitization functions like HTML entity escaping to neutralize XSS payloads, enforce bounds (limit, page size, comment length), and cover security controllers with automated test suites.
=======
## 2025-05-22 - [Secure CORS Policy and Security Headers]
**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.

## 2025-06-18 - [Missing Authentication on Sensitive tRPC Routers]
**Vulnerability:** Multiple sensitive tRPC routers (Tokens, Webhooks, Analytics) were defined using `publicProcedure`, which would allow unauthenticated access once registered in the main application router.
**Learning:** In a tRPC-based architecture, it is easy to default to `publicProcedure` when creating new routers. Security must be considered at the router definition level, especially for management and data-sensitive modules.
**Prevention:** Always use `protectedProcedure` or `adminProcedure` by default for new tRPC routers unless they are explicitly intended to be public. Implement security tests that verify authentication requirements for all registered routers.

## 2025-06-25 - [Redaction of Sensitive MCP Server Configs]
**Vulnerability:** The MCP router `getServer` and `getAllServers` endpoints were exposing raw, sensitive credentials (including Bearer tokens, passwords, and sensitive API headers) directly to authenticated clients. The API documentation claimed these fields were redacted, but the actual implementation returned raw database configurations.
**Learning:** Documented features regarding credential safety must be explicitly implemented and tested at the router level. Even with authenticated contexts (`protectedProcedure`), exposure of cleartext passwords and keys poses a credential leakage hazard if user accounts or client sessions are compromised.
**Prevention:** Always implement data redaction (`redactServerConfig` helper) to mask credentials before returning server configuration objects from the backend, and write automated tests to enforce this behavior on all registry-based endpoints.
>>>>>>> origin/main
