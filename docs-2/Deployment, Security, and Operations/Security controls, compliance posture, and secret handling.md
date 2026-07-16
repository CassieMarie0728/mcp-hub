# Security controls, compliance posture, and secret handling

## Network Security

### CORS Policy

The API implements a restrictive CORS policy that validates the `Origin` header against a whitelist of allowed origins. This prevents unauthorized credentialed requests from malicious third-party websites.

**Allowed Origins:**

- `http://localhost:8081` (Local Development - Metro)
- `http://localhost:3000` (Local Development - Server)
- `EXPO_WEB_PREVIEW_URL` (Environment-defined preview URL)
- `EXPO_PACKAGER_PROXY_URL` (Environment-defined proxy URL)

### Security Headers

The following standard security headers are enforced on all API responses:

- `X-Frame-Options: DENY`: Prevents the application from being embedded in frames, mitigating clickjacking attacks.
- `X-Content-Type-Options: nosniff`: Prevents the browser from MIME-sniffing the response away from the declared content-type.
- `X-XSS-Protection: 1; mode=block`: Enables browser XSS filtering.
- `Strict-Transport-Security` (Production only): Enforces HTTPS connections.
