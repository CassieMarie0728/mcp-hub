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
