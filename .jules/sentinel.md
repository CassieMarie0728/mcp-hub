## 2025-05-22 - [Secure CORS Policy and Security Headers]
**Vulnerability:** The application was reflecting any `Origin` header in CORS responses while also setting `Access-Control-Allow-Credentials` to `true`. This could allow malicious sites to perform credentialed requests against the API if a user is logged in. Additionally, standard security headers were missing.
**Learning:** Reflecting `Origin` is a common shortcut in development but dangerous in production when credentials are involved. Whitelisting is necessary.
**Prevention:** Always validate the `Origin` header against a whitelist and ensure standard security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) are present on all responses.
