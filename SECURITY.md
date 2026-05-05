# Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 1.x     | ✅ Yes            |
| < 1.0   | ❌ No             |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.** Instead, email security@mcphub.io with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide updates on our progress toward a fix.

## Security Practices

### Credential Management

- All tokens are encrypted using **AES-256-GCM** before storage
- Tokens are never logged or exposed in error messages
- OAuth refresh tokens are stored securely with automatic rotation
- Credentials are never transmitted over unencrypted connections

### API Security

- All API endpoints require authentication via JWT tokens
- Rate limiting is enforced to prevent abuse
- CORS is configured to allow only trusted origins
- CSRF protection is enabled for state-changing operations

### Webhook Security

- Webhook requests are verified using HMAC-SHA256 signatures
- IP whitelist/blacklist can be configured per webhook
- Webhook secrets are rotated regularly
- Failed webhook attempts are logged for audit purposes

### Database Security

- Database connections use SSL/TLS encryption
- Sensitive data is encrypted at rest
- Database backups are encrypted and stored securely
- Access is restricted to authorized services only

### Dependency Management

- Dependencies are regularly audited for vulnerabilities
- Security patches are applied promptly
- Automated dependency scanning is enabled

## Disclosure Policy

We follow responsible disclosure practices:

1. We will acknowledge receipt of your report within 48 hours
2. We will investigate and provide updates every 5 business days
3. We will work with you to understand and resolve the issue
4. We will credit you in the security advisory (unless you prefer anonymity)
5. We will release a security patch as soon as possible

## Bug Bounty

We appreciate the security research community. If you discover a critical vulnerability, please let us know and we will work with you on a responsible disclosure timeline.

## Security Updates

Security updates are released as patch versions (e.g., 1.0.1) and are applied to all supported versions. Users are encouraged to update promptly.

---

Thank you for helping keep MCP Hub secure.
