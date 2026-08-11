# MCP Hub Comprehensive Audit Report

**Date:** August 11, 2026  
**Audited surface:** Expo mobile/web client, Express/tRPC backend, MCP integrations, landing site, CI/CD, Docker/Kubernetes assets, tests, documentation, and operational controls.  
**Status:** **Not ready for a public production launch.** The application is buildable and its configured unit suite is green, but critical security, tenancy, persistence, public-site, and operational defects make a launch unsafe.

> **The blunt version:** this is a promising prototype with some genuinely solid service-level work. It is not a safe multi-user MCP platform yet. The biggest danger is not visual polish; it is that one authenticated user can reach data and credentials that do not belong to them, while the outbound server connector can be aimed at internal infrastructure. That is not a rough edge. That is the fucking load-bearing problem.

## 1. Audit Scope and Method

The audit used source review, route and dependency inventory, controlled API requests, browser verification of the web preview and public domain, production server builds, Expo static exports, runtime-memory inspection, CI/workflow review, and the configured Vitest suite. Findings are listed only where project evidence exists. The detailed working evidence, line-level references, and validation outputs live in [`COMPREHENSIVE_AUDIT_WORKLOG.md`](./COMPREHENSIVE_AUDIT_WORKLOG.md).

| Area | Evidence collected | Result |
|---|---:|---|
| Active product surface | 46 Expo routes, 22 components, 74 server modules | Route structure is significantly larger than the working product surface. |
| Tests | 225 passing, 1 intentionally skipped | Useful unit baseline; insufficient UI, native, persistence, and security integration coverage. |
| TypeScript | `pnpm check` | Passes with 0 errors. |
| Lint | `pnpm lint` | Executes successfully after repair; 0 errors and 102 warnings remain. |
| Backend build | `pnpm build` | Passes; `dist/index.js` is 133 KB. |
| Web export | `expo export --platform web` | Passes; emits 87 static routes and a 15 MB export directory. |
| Dependency audit | `pnpm audit --prod` | Fails with 2 critical, 32 high, 18 moderate, and 5 low advisories. |
| Expo compatibility | `expo install --check` | Fails; 15 package-version mismatches, including SDK-major drift. |
| Public conversion endpoint | Deployed site and CTA checks | Project domain was unavailable; primary CTA destination returned SSL error 525. |

## 2. Executive Release Decision

| Release dimension | Decision | Why |
|---|---|---|
| Private prototype / internal demo | **Conditional** | Use only with explicit warnings, trusted users, no real secrets, no production MCP endpoints, and no public marketing claims. |
| Closed beta with real users | **No-go** | Tenant isolation, SSRF controls, token storage, OAuth state handling, and data durability are missing. |
| Public web launch | **No-go** | The public domain and primary CTAs are broken; legal links and major product claims are unsupported. |
| Native Android Studio delivery | **No-go** | No generated Android project is present in the repository, despite prior readiness claims. |
| Multi-replica deployment | **No-go** | Product state, token state, workflows, and rate-limit state are process-local. Replicas would create inconsistent behavior and data loss. |

## 3. What Is Working and What Was Fixed During This Audit

The project is not devoid of substance. The fetch-based HTTP client, connection-service validation, tool-execution service, onboarding persistence, theme tests, and route-level web splitting are legitimate building blocks. TypeScript and the currently configured tests pass. The critical point is that these strengths do not yet compose into a secure product boundary.

| Low-risk repair completed | Validation |
|---|---|
| Repaired the broken ESLint toolchain with Expo’s supported flat configuration and ESLint 9. | Lint now completes with 0 errors. |
| Restored an explicit `tsx` dev dependency and changed `dev:server` to `tsx watch`. | Controlled smoke test started the API on port 3000 with normal startup logs. |
| Explicitly hid all secondary tab-group routes with `href: null`. | Live mobile-web preview now shows six intended tabs instead of 33. A regression test covers the hidden-tab contract. |
| Corrected the chat subtitle’s broken foreground utility. | Live DOM now computes `rgb(245,245,245)` over the red header, replacing black-on-red text. A regression test prevents rollback. |
| Added regression coverage. | Configured suite increased from 223 to **225 passing tests**, with one intentional skip. |

## 4. Critical Risks That Block a Real Launch

### 4.1 Multi-tenant authorization and durable ownership do not exist

MCP server registrations, tool caches, tokens, webhooks, workflows, and analytics are held in process memory and lack an owner or workspace relationship. Authenticated callers can act on arbitrary IDs because the routers generally verify only that *someone* is signed in. In practice, that means user A can enumerate, alter, rotate, or delete user B’s runtime state when identifiers can be guessed or disclosed.

The required remedy is architectural: create durable schema tables with user/workspace foreign keys; route every read and mutation through repository-level ownership checks; scope caches by tenant; redact credential material; and add cross-user denial tests. Do not “fix” this with UI filtering. The backend is the boundary that matters.

### 4.2 Arbitrary MCP URLs create an SSRF primitive

The MCP server-registration API accepts arbitrary URLs and makes outbound server-side requests without private-IP filtering, redirect revalidation, DNS-rebinding protection, or meaningful response bounds. That permits probing loopback, private network services, and cloud metadata endpoints. Given this product’s purpose, the connector is the sharpest knife in the drawer; it needs a sheath before you hand it to users.

Implement a tested URL-policy service before allowing real endpoints. It should reject embedded credentials, loopback/link-local/private IPv4 and IPv6 ranges, non-HTTPS schemes unless explicitly approved, unsafe redirects, and DNS answers that change into denied networks. Add strict timeouts, redirect limits, response-size caps, and an auditable allow/deny decision.

### 4.3 Credential, webhook, workflow, and OAuth lifecycles are unsafe

Token records are process-local and unscoped. Webhooks instantiate fresh managers per request, discard their state, and can return secrets in responses. Workflows claim persistence but use a global in-memory store and raw IDs. OAuth authorization state is public, memory-only, unbound to a user session, reusable, and the code-exchange endpoint returns an access token directly.

These features need to be either removed from the public surface or rebuilt around durable tenant-scoped records, write-only secret fields, encryption-key management, single-use expiring state, PKCE, server-side credential storage, revocation, rotation, and audit trails. Until then, they are dangerous product theatre.

### 4.4 The real server-connection UI is not real

The primary Servers screen has display-only name and credential values, no `TextInput`, and a disabled connection action. There are also three competing connection implementations using incompatible server/tRPC/native-bridge contracts. The claimed core workflow exists in fragments, not as one reliable end-to-end path.

Choose one server-backed connection contract. Build a secure input flow with validation and user-visible errors. Delete or archive the other two paths. Then test create, failed validation, failed authorization, failed network connection, reconnect, tool discovery, and deletion against the same backend implementation.

### 4.5 The public site currently converts nobody

The published project domain returned `Not Found`; the dominant app CTAs pointed at an SSL-broken domain; pricing CTAs lacked actions; and legal/security links resolved to files that do not exist. The page also claims enterprise security, durability, RBAC, audit logging, horizontal scaling, disaster recovery, and real-time behavior the code does not deliver.

Do not buy traffic or announce a launch until the correct public domain, CTA destination, legal pages, monitoring, and honest content are live. Marketing is not exempt from truth just because the headline looks cool.

### 4.6 Native readiness is not established

There is no `android/` directory or `AndroidManifest.xml` in the repository. Active routes reference three incompatible custom native bridge contracts, and no implementation or registration exists. The app is therefore neither Android Studio-ready from this codebase nor reliable as a native MCP bridge product.

Decide whether the product is server-mediated cross-platform MCP management or a custom-native bridge application. If it is the latter, create one documented module, generate the native project, commit or reproducibly generate it, implement capability detection, and run Android/iOS integration tests.

## 5. High-Priority Product, UX, and Accessibility Gaps

| Area | Verified gap | Effect on users | Required correction |
|---|---|---|---|
| Navigation | Six visible tabs include misleading labels/icons; Blog is labeled Logs and shares the Home icon. | Product information architecture reads as a screen dump, not a coherent app. | Rebuild around 4–5 real areas: Hub, Servers, Run/Tools, Activity, More. |
| Dead navigation | Settings points to six removed routes through `as any`. | Users land on framework-level unmatched-route screens. | Remove until rebuilt or route to current product areas; add typed route contract tests. |
| Error/empty states | Servers becomes blank when backend data is unavailable. | Users cannot tell whether they are offline, unauthenticated, loading, or empty. | Implement loading, error, retry, signed-out, empty, and populated states. |
| Accessibility | 49 interactive controls were found with zero explicit labels, hints, roles, or state metadata. | Screen-reader and stateful-control support is accidental at best. | Add a reusable accessible control primitive and test labels/states. |
| Forms | Credential fields lack reliable secure entry, keyboard behavior, autofill hints, and standardized keyboard avoidance. | Sensitive setup becomes frustrating and error-prone on a phone. | Standardize a mobile form primitive and test the connection flow at compact portrait width. |
| Recovery | No branded `+not-found` or route-level error boundary exists. | Failures fall into generic framework recovery screens. | Add branded recovery, retry, and return-to-Hub actions. |
| Chat | Empty state explains the prerequisite but offers no action to connect a server. | Users hit a dead end. | Add a direct action to the one supported connection flow. |
| Refresh | Dashboard pull-to-refresh is a one-second timeout, not a refresh. | The app lies politely about doing work. | Wire query invalidation or remove the gesture. |

Apple advises keeping tab structures simple, while Android’s navigation guidance calls for three to five equal-priority destinations. Expo documents `href: null` as the correct way to retain a route without rendering a tab button. [1] [2] [3]

## 6. Performance and Memory Findings

The web export proves that async feature chunks are working, but the shared baseline remains heavy. The production export has a 1.08 MB root-layout chunk, 920 KB common chunk, and 993 KB entry chunk before route-specific code. Gzipped, those three chunks total roughly 750 KB. The export directory is 15 MB and contains 87 static routes, many duplicated or unrelated to a viable web journey.

The root layout eagerly imports notification behavior and the extended MCP bridge. It prompts for notifications on initialization and adds Expo Notifications code to every route, including anonymous web sessions. The global app provider eagerly hydrates servers, settings, and up to 100 execution records for every route. Meanwhile, unused audio/video packages and their config plugins remain installed.

| Priority | Performance action | Success criterion |
|---|---|---|
| P1 | Defer notifications until authenticated native opt-in; do not import the bridge in the root web path. | First web route no longer includes notification setup or triggers a permission attempt. |
| P1 | Move feature routes out of the tab group and delete/archive non-product screens. | Intentional web route count only; no duplicate crawlable paths. |
| P2 | Split global state by domain and lazy-load execution history. | App shell does not hydrate activity data before Activity is visited. |
| P2 | Remove unused Expo packages/plugins after SDK validation. | Lower native dependency and permission footprint. |
| P2 | Add bundle and Lighthouse budgets to CI. | Shared JavaScript budget is enforced and regressions fail builds. |

The 955 MB Metro process observed during the audit is development-tool overhead, not a shipped-app memory measurement. Avoid duplicate watchers, but do not pretend that reducing the dev server RSS proves the native app is lean. Device-level profiling still needs to happen.

## 7. Dependency, Test, and Release Risk

The final verification sequence passes type checking, linting, tests, backend build, and web export. The clean-looking part ends there. The production dependency audit reports **2 critical and 32 high** advisories. Expo compatibility reports 15 mismatches, including SDK 55 packages in an SDK 54 project. These cannot be safely fixed by a blind `audit --fix`; they need a versioned framework dependency pass with compatibility checks.

The test count is useful but overstated as product evidence. The configured suite runs 14 active files, excludes 26 executable-looking `__tests__` suites, has no coverage provider or threshold, no component renderer, no browser E2E, no Detox/native test, no real database lifecycle, and no tests for the exact critical risks found here.

| Current gate | Current state | Needed release gate |
|---|---|---|
| Install | CI permits lockfile drift. | `pnpm install --frozen-lockfile`. |
| Lint | Toolchain now works; 102 warnings remain. | Fix or deliberately classify warnings; block new warnings. |
| Unit tests | 225 passing / 1 skipped. | Add ownership, SSRF, OAuth, secret-redaction, UI-flow, and device/browser smoke tests. |
| Coverage | None. | V8 coverage with risk-based thresholds and CI artifacts. |
| Build | Backend bundle and static web export run locally. | CI must run both, save artifacts, and verify a production boot/health check. |
| Dependencies | Audit fails. | Compatible Expo/RN upgrade plan, approved overrides only, repeatable audit baseline. |
| Deployment | Two overlapping Pages workflows; no verified application deploy. | One deployment owner, immutable artifacts, smoke tests, rollback procedure. |

## 8. Operations, Documentation, and Truthfulness

The repository contains useful recent operator documentation, but the top-level README advertises 98% coverage, 723 tests, obsolete Expo/tRPC versions, commands that do not exist, and feature claims that do not match the code. The result is a documentation split-brain: internal operations pages tell the truth while the public story sells science fiction.

Observability is currently a static liveness endpoint and stdout logs. A Prometheus/winston/alerting subsystem exists but is not mounted. Kubernetes assets are starter scaffolding with placeholder image and host values, no probes, resources, security context, TLS policy, autoscaling, rollout verification, or safe state model. A two-replica deployment would worsen correctness because state lives in process memory.

The Docker image also needs a least-privilege runtime stage, production-only dependencies, a health check, managed secret strategy, and a tested runbook. Backups and recovery are not designed because most product state does not persist.

## 9. Prioritized Execution Plan

### Immediate containment: do this before anyone else touches the public product

| Order | Work | Why it comes first | Exit criteria |
|---:|---|---|---|
| 1 | Take the broken public CTA and unsupported public claims out of circulation. | The site currently routes prospects to an SSL failure and makes untrue security/reliability promises. | Canonical public URL and app destination return 200/healthy; legal pages exist; claims match verified capability. |
| 2 | Disable or restrict arbitrary MCP registration and token/webhook/workflow public operations. | These endpoints expose SSRF, cross-user access, secret disclosure, and non-durable state. | Sensitive prototype routes are private/disabled until their secure replacements exist. |
| 3 | Establish a single supported server-connection workflow. | Core setup is blocked by display-only fields and conflicting implementations. | User can create a connection, receive accessible validation, discover tools, and delete it through one path. |
| 4 | Create a security migration design before implementation. | Fixes require data model, encryption, and authorization decisions. | Approved schema/ADR defines tenancy, ownership, secrets, SSRF, retention, sessions, and audit events. |

### Foundation: make the backend a product boundary

| Order | Workstream | Core deliverables | Definition of done |
|---:|---|---|---|
| 5 | Durable tenant model | `workspaces`, `workspace_members`, `mcp_servers`, encrypted credentials, tools, executions, workflows, webhooks, OAuth states, audit events. | Every durable record has ownership, indexes, lifecycle fields, retention rules, and migration tests. |
| 6 | Authorization service | Repository methods scoped by owner/workspace; admin rules; redacted response DTOs. | Cross-user negative tests cover every ID-addressable resource. |
| 7 | Outbound connection policy | URL parsing, DNS/IP screening, redirect validation, timeout/size budgets, egress logging. | SSRF adversarial tests cover loopback, private IP, link-local, IPv6, credentials, redirects, and DNS rebinding. |
| 8 | OAuth and secrets | One-time user-bound state, PKCE, write-only secret displays, server-side token storage, key rotation. | No OAuth token/secret returns from public endpoints; exchange and refresh tests pass. |
| 9 | Bounded execution | Single tool-execution contract, schema-driven parameters, concurrency/depth/timeout/cancellation budgets. | Execution has owner context, durable history, safe errors, and auditable outcomes. |

### Product readiness: turn the shell into an actually usable mobile app

| Order | Workstream | Core deliverables |
|---:|---|---|
| 10 | Navigation and information architecture | Four or five honest primary tabs; Stack routes for details; remove demos/marketing from product navigation; branded error and not-found recovery. |
| 11 | Accessible connection and execution UX | Secure fields, keyboard behavior, accessible labels/states/hints, touch-target standards, loading/error/empty/retry states, direct prerequisite actions. |
| 12 | Native decision and verification | Generate/commit or reproducibly generate Android source; eliminate unsupported bridge contracts; test actual Android and iOS behavior. |
| 13 | Web and landing launch | Repair public deployment, conversion flow, lawful pages, truthful copy, metadata, sitemap, reduced motion, mobile demos, and analytics consent/instrumentation. |

### Engineering maturity: keep it from crawling back into the ditch

| Order | Workstream | Core deliverables |
|---:|---|---|
| 14 | Dependency alignment | One controlled Expo SDK 54 compatibility pass, direct package review, advisory remediation/overrides, Dependabot, frozen lockfile. |
| 15 | Test strategy | Active test inventory, V8 coverage, component tests, web E2E, native smoke tests, database migration tests, security regression suite. |
| 16 | Observability and delivery | Structured logs, readiness vs liveness, safe metrics, alerting, artifact publishing, immutable image tags, rollout health checks, rollback drills. |
| 17 | Performance budget | Lazy native integrations, smaller root bundle, intentional route export, route-level transfer budgets, device profiler baseline. |
| 18 | Documentation reset | Rewrite README and public docs from code, archive stale generated documents, automate reference/script/version checks. |

## 10. Definition of “Ready to Launch”

MCP Hub is ready for a controlled beta only when the public CTA and domain work; the connection flow works end-to-end; servers, tools, credentials, workflows, and history are durable and tenant-scoped; outbound MCP access has SSRF controls; OAuth and secrets have a safe lifecycle; current SDK versions align; required security and UI tests pass; the release pipeline builds immutable artifacts; and customer-facing claims are true.

Until then, call it what it is: an actively evolving prototype with a good visual direction and some useful services, not a hardened automation platform. That honesty is not a marketing failure. It is how you keep a promising thing from getting murdered by reality before it has a chance to grow teeth.

## References

[1] [Apple Human Interface Guidelines: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)  
[2] [Android Developers: Navigation bar](https://developer.android.com/develop/ui/compose/components/navigation-bar)  
[3] [Expo Router: JavaScript tabs](https://docs.expo.dev/router/advanced/tabs/)  
[4] [Google Search Central: Supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags)  
[5] [Google Search Central: Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)  
[6] [Chrome for Developers: Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)
