## 2025-05-22 - [Secure CORS Policy and Security Headers]

**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.

## 2025-05-23 - [Sensitive Credential Leakage in MCP Router]
**Vulnerability:** The `mcpRouter` procedures `getServer` and `getAllServers` were returning raw `MCPServerConfig` objects, which include sensitive authentication tokens, passwords, and authorization headers.
**Learning:** Returning raw configuration objects from the backend can inadvertently expose secrets to the client-side, even if the endpoints are protected. Proactive redaction is necessary for any object containing credentials.
**Prevention:** Implement a sanitization/redaction layer for any data models that store credentials before they are sent over the wire.
