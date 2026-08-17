# MCP Hub Forensic Audit Status — 2026-08-17

## Audit Outcome

This audit re-examined the MCP Hub mobile app, backend, authorization boundaries, durable activity reporting, native Android configuration, dependency graph, release automation, landing site, and operational documentation after the secure activity-reporting milestone. The review found several real defects and misleading legacy paths. Each in-sandbox finding was remediated and protected by focused regression coverage.

> **Bottom line:** the current build no longer exposes the identified client-side execution, fictional provider-registry, local-history, dead-navigation, or sensitive-authentication logging paths. The release matrix passes in the restored environment.

| Validation area | Verified result |
|---|---|
| Full Vitest suite | 296 passed; 1 intentional skip |
| TypeScript | `pnpm check` passed with zero errors |
| Lint | `pnpm lint` passed with zero warnings or errors |
| Backend artifact | `pnpm build` passed; `dist/index.js` generated |
| Static web artifact | `CI=1 npx expo export --platform web --max-workers 1` passed |
| Managed services | Development server running; language service and TypeScript report no errors |
| Android contract | Regenerated native manifest present and Android permission regression test passes |

## Verified Findings and Remediations

| Area | Finding | Remediation | Regression evidence |
|---|---|---|---|
| Session isolation | A signed session did not reject a mismatched application identifier. | Enforced application-scoped session validation in the server authentication adapter. | `tests/session-app-scope.test.ts` |
| AI edge | AI routes accepted overly large bodies, could surface provider detail, and did not fully clean up disconnected streams. | Added bounded JSON parsing, request validation, a dedicated limiter, generic failures, and abort-aware provider calls. | `tests/ai-security.test.ts` |
| Provider registry | Alternate registry routes advertised vendor REST endpoints as if they were real MCP servers and accepted provider tokens outside the canonical workflow. | Fail-closed the alternate router and redirected registry-based server and tool surfaces to HTTPS-only registration. | `tests/extended-router-security.test.ts`, `tests/legacy-route-security.test.ts` |
| Device-local server state | A secondary Servers screen could display, edit, and delete local server records separate from tenant-backed state. | Retired the screen in favor of canonical server registration. | `tests/legacy-route-security.test.ts` |
| Settings truthfulness | Settings linked to retired routes and claimed to erase execution history through obsolete local state. | Linked only to real history and analytics screens; replaced deletion with an honest audit-records boundary. | `tests/route-loading-config.test.ts` |
| OAuth diagnostics | Callback diagnostics logged authorization-code fragments, callback URLs, user records, and raw provider errors. | Rewrote the callback around silent credential handling and generic user-safe failures. | `tests/auth-logging-security.test.ts` |
| Home assistant CTA | The AI call-to-action navigated to the intentionally retired chat route. | Wired it to the existing assistant modal. | `tests/route-loading-config.test.ts` |
| Android project | The regenerated Android manifest was absent after environment recovery. | Recreated the native Android project from audited Expo configuration. | `tests/android-permission-contract.test.ts` |
| Dependency graph | Express 4 constrained `qs` to an audited vulnerable line. | Upgraded to Express 5.2.1 and pinned `qs` 6.15.3 through workspace overrides. | `tests/dependency-security-overrides.test.ts` |
| CI coverage | Static web export was checked locally but absent from CI. | Added a static Expo web-export gate to the CI workflow. | `tests/ci-release-contract.test.ts` |
| Landing page | Contact navigation targeted no section and the technology list repeated tRPC. | Repaired the mailto destination and removed duplicate content. | `tests/landing-truthfulness.test.ts` |

## Architecture Boundaries Confirmed

The active server-registration path remains **backend-backed, HTTPS-only, tenant-scoped, and SSRF-protected**. It is the only sanctioned path for adding a server. Tool discovery, tool execution, execution history, and analytics are permitted only through authorized runtime records. Workflow, webhook, token-lifecycle, OAuth-provider-lifecycle, and provider-registry features remain fail-closed until durable tenant-scoped models exist.

This is intentionally less flashy than fake progress. It is also less likely to hand someone’s credentials to a cardboard cutout wearing an “integration” sticker.

## Dependency and SDK Review

The refreshed production audit changed from **1 critical / 26 high / 13 moderate / 4 low** to **1 critical / 26 high / 12 moderate / 4 low** after the Express and `qs` remediation. The remaining advisories are overwhelmingly transitive Expo, Metro, React Native, and CLI tooling paths. The unresolved `tar` path remains owned by Expo CLI 54.0.26, which resolves `tar` 7.5.18; forcing a higher version outside Expo’s tested SDK line remains deliberately avoided.

Expo diagnostics completed 16 of 18 checks. The two intentional deviations are the pnpm-required Metro symlink setting and a single unified, newer React Navigation 7 family. Downgrading navigation packages merely to silence the diagnostic would reintroduce family drift and is not treated as a remediation.

## Remaining Constraints and Next Work

| Priority | Constraint or opportunity | Current posture |
|---|---|---|
| High | Full Android Gradle debug build | Deferred until a runner with a provisioned Android SDK is available; manifest and configuration contracts are verified. |
| High | Expo CLI transitive Tar advisory | Monitor for an SDK 54-compatible upstream update; do not force an untested override. |
| High | Authorized conversational MCP assistant | The secure generic assistant exists, but conversational MCP execution must be designed around owned-server authorization and explicit user intent. |
| Medium | Durable OAuth, webhook, and workflow models | Still intentionally unavailable until tenant lifecycle, retention, and audit models are implemented. |
| Medium | Execution-log retention controls | Audit-log deletion remains unavailable until an authorization and retention policy is specified. |

## Release Decision

The audited source is suitable for the current **early-access** posture: secure HTTPS server registration, authorized runtime operations, tenant-scoped activity reporting, and an honest marketing surface. It is **not** represented as a fully launched automation or provider-integration platform. That distinction remains part of the security posture, not just the copywriting.
