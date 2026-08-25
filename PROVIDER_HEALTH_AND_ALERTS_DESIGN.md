# Provider Health, Usage Limits, and Reset Alerts

## Product Boundary

The settings panel must never invent remaining usage. It displays numerical provider health only when the provider response exposes a usable limit field or rate-limit header. Key testing uses lightweight model/key metadata endpoints where available, not a generation request. The device receives a reset alert only when the application receives a trustworthy reset time or duration from the configured provider response.

| Provider | Secure key test | Supported indicator | Reset alert support |
|---|---|---|---|
| OpenRouter | `GET https://openrouter.ai/api/v1/key` with bearer key | `limit`, `limit_remaining`, and `limit_reset` when the provider returns them | Supported when `limit_reset` yields a date/time that can be scheduled on the device. |
| Groq | `GET https://api.groq.com/openai/v1/models` with bearer key | Documented `x-ratelimit-*` headers, including remaining requests/tokens and reset durations | Supported for a concrete returned reset duration; otherwise the UI stays honest and does not schedule a guess. |
| Gemini | `GET https://generativelanguage.googleapis.com/v1beta/models` with API-key header | No documented remaining quota field; Gemini limits are per project rather than per key | Not scheduled. The UI links users to provider-side quota visibility through plain-language guidance. |
| Mistral | `GET https://api.mistral.ai/v1/models` with bearer key | No standard end-user key quota field used by this product | Not scheduled. Account/workspace usage remains provider-dashboard controlled. |

## Alert Delivery Decision

The first release uses **opt-in local device notifications**. A reset alert is scheduled on the device only after a key-health refresh has received a specific reset time/duration. This does not require exposing user keys to a background worker or pretending a future quota state is known. It is available on Android and iOS, requires notification permission, and is explicitly unavailable on web.

## Security Rules

The server decrypts provider keys only inside protected workspace-scoped procedures, uses fixed HTTPS URLs, returns status and safe numeric metadata only, and stores no raw key or provider response body in health records. The mobile client asks the user for notification permission only after they enable reset alerts.

## Verified References

- OpenRouter: https://openrouter.ai/docs/api_reference/limits
- Groq: https://console.groq.com/docs/rate-limits
- Gemini models API: https://ai.google.dev/api/models
- Gemini rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Mistral models API: https://docs.mistral.ai/api/endpoint/models
