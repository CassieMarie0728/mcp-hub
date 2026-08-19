# Project TODO

Earlier project planning material is retained in `archive/superseded-guides/todo.md` after the shared documentation reorganization.

## Phase 4: Route-Compatible Lazy Loading & Startup Optimization

- [x] Reapply Expo Router async-route configuration for web and development
- [x] Reapply the shared React Navigation version alignment
- [x] Move inactive screen archives outside `app/` so Expo Router excludes them from route bundles
- [x] Move development-only route experiments outside `app/` so they are excluded from production bundles
- [x] Add route-loading regression tests and documentation
- [x] Verify type checking, full tests, production web export, and route startup

## Checkpoint Reconciliation: Phase 4 + Incoming CI Update

- [x] Create a safeguarded snapshot of all local Phase 4 work
- [x] Synchronize the shared CI update from the remote project branch
- [x] Reapply and reconcile the Phase 4 changes with the CI update
- [x] Re-run full validation and save a publishable checkpoint

## Comprehensive App, Website, and Landing-Page Audit

- [x] Inventory the codebase, routes, build outputs, and deployment surfaces
- [x] Audit dependencies, configuration, supply-chain risk, and secret handling
- [x] Audit mobile architecture, navigation, Android readiness, and native behavior
- [x] Audit backend APIs, authentication, authorization, validation, and data flows
- [x] Audit app UX, accessibility, responsiveness, error handling, and empty states
- [x] Audit landing-page content, SEO, conversion journey, trust, and calls to action
- [x] Audit performance, bundle composition, memory pressure, and expensive renders
- [x] Audit test quality, coverage gaps, release gates, and CI readiness
- [x] Audit documentation, observability, backup, and operational readiness
- [x] Fix verified low-risk defects found during the audit
- [x] Produce a detailed prioritized audit report and remediation roadmap

## Critical Remediation Recovery

- [x] Reconstruct tenant-scoped MCP persistence, credential encryption, and ownership-scoped repository access
- [x] Reconstruct SSRF-safe outbound MCP transport and secure request-local execution runtime
- [x] Reconnect MCP routers to secure operations and fail-close incomplete OAuth, token, webhook, and workflow lifecycles
- [x] Rebuild the backend-backed HTTPS-only server connection screen and archive the native bridge screen
- [x] Repair landing-page claims, calls to action, metadata, technical stack disclosure, and local-link contracts
- [x] Restore security, lifecycle, route, landing, and encryption regression tests; complete full validation
- [x] Align specified Expo SDK 54 packages and add required Expo configuration plugins
- [x] Restore security-foundation documentation and observation-log entries

## Dependency and Release Hardening

- [x] Remove unused Socket.IO server and client dependencies after source and build validation
- [x] Document the remaining Expo navigation advisory drift and upstream transitive audit exposure
- [x] Require frozen dependency installation and backend build verification in CI

## Continued Audit Remediation

- [x] Validate Android native project generation, configuration, and build readiness using lightweight checks
- [x] Remove unused audio/video modules and generated Android media permissions
- [ ] Run a constrained Android Gradle debug build on a provisioned Android SDK runner
- [x] Perform advisory-by-advisory dependency triage for remaining production audit paths
- [ ] Revisit the unresolved Expo CLI Tar advisory when an SDK 54-compatible upstream patch is available
- [x] Assess and remediate the next highest-risk lifecycle or authorization gap
- [x] Remove sensitive session-token and user-object diagnostics from the authentication hook
- [x] Update remediation status, evidence, and release blockers after the next audit pass

## Lint and Runtime-Quality Remediation

- [x] Classify all current lint warnings by safe cleanup versus runtime-sensitive behavior
- [x] Remove safe unused imports, variables, and duplicate-import warnings
- [x] Resolve high-impact hook dependency and stale-state warnings
- [x] Validate and document the reduced lint-warning baseline
- [x] Resolve or retire the remaining unused-variable warnings in legacy and secondary route modules

## Legacy Route Alignment

- [x] Classify remaining unused-variable warnings by secure workflow relevance and retirement candidate
- [x] Repair or retire stale native-bridge and mock lifecycle routes that conflict with the secure backend
- [x] Remove remaining behavior-neutral unused-variable warnings after route decisions are complete
- [x] Validate route behavior and document the next audit findings
- [x] Retire native-bridge tool control and execution routes that bypass the secure authorized MCP runtime
- [x] Retire the legacy tool-detail execution route that uses local server state and client-side tool invocation
- [x] Retire the legacy edit-server route that can modify local stdio and arbitrary transport configurations outside the secure repository
- [x] Retire local macro editing, scheduling, sharing, and chaining routes until durable tenant-scoped workflow persistence exists
- [x] Retire the local tool-results route until it renders tenant-scoped authorized execution records
- [x] Replace fabricated analytics metrics with an explicit unavailable state until analytics reads tenant-scoped execution logs
- [x] Retire the legacy chat route that parses messages into client-side MCP tool execution outside the authorized runtime
- [x] Retire the device-local server-preset route because it models HTTP, WebSocket, and stdio transports outside the secure server registration path

## Lifecycle Truthfulness Remediation

- [x] Replace mock webhook lifecycle UI with an explicit unavailable state while backend persistence remains gated
- [x] Replace mock workflow-template UI with an explicit unavailable state while backend workflow persistence remains gated
- [x] Replace simulated OAuth UI and unsupported token-storage claims with an explicit unavailable state
- [x] Replace mock token management UI and local credential lifecycle actions with an explicit unavailable state
- [x] Replace the active macro-builder workflow UI with an explicit unavailable state until durable workflow execution exists
- [x] Retire the legacy add-server screen that permits local-process, SSE, and WebSocket paths outside the secure outbound policy
- [x] Replace the active execution-debugger sample run with an explicit unavailable state until durable workflow execution logs exist
- [x] Retire the legacy local execution-history route until it reads tenant-scoped secure execution logs

## Secure Activity Reporting Milestone

- [x] Map authorized runtime outputs and the tenant-scoped execution-log data contract
- [x] Design protected history and analytics queries with ownership, pagination, and aggregate boundaries
- [x] Implement backend-backed execution history using authorized runtime records
- [x] Implement backend-backed analytics from real tenant-scoped execution logs
- [x] Add history and analytics security, data-shape, and UI regression coverage
- [x] Validate the complete milestone and preserve it in a checkpoint

## Post-Activity-Reporting Comprehensive Audit

- [x] Regenerate the missing Android native project after the permission contract exposed the absent manifest
- [x] Establish a fresh full validation baseline and capture service/build health
- [x] Harden AI request validation, provider error handling, abort behavior, and body-size limits
- [x] Enforce app-scoped session validation in the server authentication adapter
- [x] Retire or replace registry-backed provider connections that advertise unsupported MCP endpoints outside the canonical HTTPS registration workflow
- [x] Retire the registry-backed tool browser that fabricated provider tools and invoked the unsupported extended router
- [x] Re-audit backend authorization, data integrity, secure runtime, and API contracts
- [x] Remove settings navigation to retired routes and retire the obsolete local execution-history clear action
- [x] Retire the secondary device-local Servers list that exposes legacy local edit, delete, and connection behavior
- [x] Remove OAuth callback diagnostics that expose authorization-code fragments or user records in client logs
- [x] Wire the home AI call-to-action to the existing assistant modal instead of the retired chat route
- [x] Re-audit mobile route behavior, navigation, onboarding, and truthful UI states
- [x] Pin the patched qs parser version required by the Express dependency graph
- [x] Add static Expo web export validation to CI so deployable client artifacts are checked on every change
- [x] Repair verified landing-page navigation and content defects
- [x] Re-audit dependencies, build output, Android readiness, CI, landing site, and operations documentation
- [x] Remediate every verified in-sandbox finding and add regression coverage
- [x] Run final full validation and publish an evidence-backed audit status update

## Authorized Assistant and Durable Lifecycle Foundations

- [x] Map the existing assistant, secure runtime, credential vault, OAuth, webhook, and workflow boundaries
- [x] Reconcile live database schema drift before enabling any new tenant-scoped persistence
- [x] Introduce an additive namespaced tenant persistence layer that leaves incompatible legacy tables untouched
- [x] Design workspace-authorized conversational execution with explicit tool approval and encrypted user-supplied provider keys
- [x] Ensure assistant UX and backend deny unselected-provider fallback and expose clear provider-configuration state
- [x] Implement encrypted tenant-scoped provider-key lifecycle management for the assistant
- [x] Implement the authorized conversational MCP assistant backend and mobile interface
- [x] Design durable tenant-scoped OAuth connection, webhook subscription, and workflow data models
- [x] Implement protected OAuth, webhook, and workflow lifecycle foundations
- [x] Build truthful mobile interfaces for durable OAuth records, webhook configuration, and workflow drafts
- [x] Add security, tenancy, lifecycle, and mobile-flow regression coverage
- [x] Run complete release validation and save a phone-test-ready checkpoint

## Multi-Provider BYOK Assistant Expansion

- [x] Verify provider-specific free-tier model rules and rate-limit behavior for Gemini, Groq, and Mistral
- [x] Extend encrypted tenant-scoped provider configuration to OpenRouter, Gemini, Groq, and Mistral
- [x] Implement fixed-endpoint provider adapters and classified user-safe rate-limit errors
- [x] Add secure provider API-key management in settings and provider selection in the assistant
- [x] Add multi-provider, free-tier, rate-limit, and secret-exposure regression coverage
- [x] Run full validation and save a phone-test-ready checkpoint

## Provider Health, Usage Limits, and Reset Alerts

- [x] Verify official per-provider key-test, quota-header, and reset-time capabilities
- [x] Add durable tenant-scoped provider health snapshots and opt-in reset-alert preferences
- [x] Implement protected API-key testing and truthful supported usage-limit refreshes
- [x] Add settings controls for key testing, health status, remaining-limit indicators, and opt-in alerts
- [x] Add regression coverage for secret safety, provider limit data, and reset notifications
- [x] Run full validation and save a phone-test-ready checkpoint

## Opt-In Provider Fallback and Notification Retry

- [x] Define explicit fallback eligibility, ordering, and free/no-surprise safeguards
- [x] Add tenant-scoped fallback preferences and short-lived retry request persistence
- [x] Implement rate-limit-only fallback routing and protected retry retrieval
- [x] Add fallback controls, fallback status, and notification-tap retry routing in the mobile UI
- [x] Add regression coverage for no-paid-fallback, retry expiry, tenant isolation, and tool-approval preservation
- [x] Run full validation and save a phone-test-ready checkpoint

## Industrial Red Brand Refresh

- [x] Audit current icon, splash, landing, and marketing asset references
- [x] Create a native-compatible MCP Hub splash screen from the supplied brand art
- [x] Replace app icon family and web banner surfaces with the supplied MCP Hub imagery
- [x] Verify native/web asset references, visual fit, and save a branded checkpoint

## Authorized Assistant and Durable Lifecycle Foundations — Superseded Initial Plan

- [x] Map current conversational assistant, secure runtime, OAuth, webhook, and workflow boundaries
- [x] Design workspace-authorized conversational execution with explicit user intent and tool approval
- [x] Implement the authorized conversational MCP assistant backend and mobile interface
- [x] Design durable tenant-scoped OAuth connection, webhook subscription, and workflow data models
- [x] Implement protected OAuth, webhook, and workflow lifecycle foundations
- [x] Add security, tenancy, lifecycle, and mobile-flow regression coverage
- [x] Run complete release validation and save a phone-test-ready checkpoint
