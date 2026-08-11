# MCP Hub Security Foundation References

This record documents the security controls that underpin MCP Hub’s connection workflow. It is intentionally specific about **what the current code enforces** and equally specific about the work that remains gated.

## Outbound MCP Connections

MCP endpoints are user-supplied network destinations, so they are treated as a server-side request forgery (SSRF) boundary. The outbound policy accepts HTTPS endpoints only, rejects URL user-info and non-standard ports, resolves all DNS answers before a request, blocks private, loopback, link-local, multicast, carrier-grade NAT, documentation, and metadata-adjacent ranges, pins the request to a validated DNS result, disallows redirects, limits responses to 1 MiB, and applies an eight-second default timeout.

The implementation also rejects routing and message-framing headers such as `Host`, `Connection`, `X-Forwarded-*`, `Transfer-Encoding`, and any CRLF-containing header name or value. This follows the central OWASP recommendation to validate destinations and avoid allowing a user-controlled request primitive to reach internal networks.[1]

| Control | MCP Hub implementation | Primary reference |
|---|---|---|
| Endpoint scheme and port | HTTPS only; standard HTTPS port only | [OWASP SSRF Prevention Cheat Sheet][1] |
| DNS validation | Resolve all returned addresses and reject any blocked address | [Node.js DNS lookup API][2] |
| Request transport | Direct `https.request` with a custom validated lookup | [Node.js HTTPS API][3] |
| Redirect behavior | Reject all 3xx responses | [OWASP SSRF Prevention Cheat Sheet][1] |
| Response exhaustion | 1 MiB response cap and bounded timeout | [Node.js HTTPS API][3] |

## Credential Encryption

MCP credentials are stored separately from public server metadata. The vault uses AES-256-GCM with a fresh 96-bit initialization vector and authenticated encryption tag for each payload. The deployment key must decode to **exactly 32 bytes** and is never returned through tRPC or rendered in the mobile client.

| Requirement | Current behavior |
|---|---|
| Key material | `MCP_CREDENTIAL_ENCRYPTION_KEY` accepts 32-byte base64 or 64-character hexadecimal material only. |
| Envelope format | Version, IV, GCM authentication tag, and ciphertext are base64url encoded. |
| Plaintext exposure | Credentials are decrypted only into a request-local runtime and discarded after the operation completes. |
| Failure mode | Invalid or tampered envelopes fail closed without exposing underlying crypto details. |

## Regression Coverage

The suite covers blocked address classes, unsafe endpoint forms, mixed DNS answers, header injection attempts, credential round trips, tamper rejection, private-destination registration, lifecycle gates, public response shape, and landing-page claim contracts. Any change to the outbound or credential boundary must extend those tests before it is considered complete.

## References

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html "OWASP Server-Side Request Forgery Prevention Cheat Sheet"
[2]: https://nodejs.org/api/dns.html#dnspromiseslookuphostname-options "Node.js DNS promises lookup documentation"
[3]: https://nodejs.org/api/https.html#httpsrequestoptions-callback "Node.js HTTPS request documentation"
