# Multi-Provider BYOK Assistant Design

## Product Contract

MCP Hub stores one user-selected assistant provider key per workspace in the existing AES-256-GCM encrypted vault. The application never ships a shared provider key, never sends secrets to the mobile client after save, and never silently switches to another provider or paid model.

| Provider | Allowed configuration rule | Fixed API endpoint | Honest limit behavior |
|---|---|---|---|
| OpenRouter | Model identifier must end in `:free` | `https://openrouter.ai/api/v1/chat/completions` | Only explicit provider rate-limit errors are surfaced. |
| Gemini | Allowlisted free-tier text models only | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | Gemini applies limits per Google project, across RPM/TPM/RPD dimensions. A 429 is presented as a temporary free-tier limit, never as a payment prompt. |
| Groq | Allowlisted free-plan chat models only | `https://api.groq.com/openai/v1/chat/completions` | Groq returns 429 for a limit hit and may include `retry-after`; its limits apply at organization level. |
| Mistral | Allowlisted entry models only; usage allowance belongs to the user's Mistral account | `https://api.mistral.ai/v1/chat/completions` | No claim that a model is permanently free. Quota, payment, and rate limits remain controlled by the user's own Mistral account. |

## User Experience Rules

Provider setup must explain the pricing/allowance reality before a key is saved. The UI may show the selected provider and model, but never the stored key. A provider limit response gets a concise, playful message such as: “Your free-tier goblin hit the snack limit. Wait a minute, trim the prompt, or check this provider’s dashboard.” The message must be scoped to the configured provider and must not suggest a paid fallback.

## Security Rules

All provider calls use a fixed, source-controlled HTTPS endpoint. Model strings are validated server-side per provider. User-controlled base URLs are prohibited. A provider response can prepare at most one MCP tool proposal; execution remains behind the existing one-time user approval flow.

## Verified References

Google documents Gemini limits across RPM, TPM, and RPD, applies them per project, and returns `429 RESOURCE_EXHAUSTED` for limit hits. Groq documents organization-level limits and `429 Too Many Requests` with optional `retry-after`. Mistral documents organization/workspace usage and limits; the account owner controls allowance and billing.

- https://ai.google.dev/gemini-api/docs/rate-limits
- https://console.groq.com/docs/rate-limits
- https://docs.mistral.ai/admin/billing-usage/usage-limits
