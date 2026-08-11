# Skill Observation Log

Observations captured during task-oriented work.

**Status key:** OPEN = not yet actioned | ACTIONED (YYYY-MM-DD) = skill updated/created | DECLINED (YYYY-MM-DD) = user decided not to pursue

---

## 2026-08-11

### Observation 1: Dependency removals require script-level validation

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** MCP Hub memory optimization and Expo Router route-loading work.
**Skill:** Existing workflow: dependency optimization
**Type:** open-source
**Phase/Area:** Package removal and validation

**Issue:** Development dependencies were removed successfully at the package level, but package scripts still referenced removed executables. This left the development server unable to start until the scripts were corrected.

**Suggested improvement:** Require a post-removal audit of every package script and a clean start command before declaring any dependency-removal phase complete.

**Principle:** A package removal is only complete when declarations, lockfile, automation scripts, and representative runtime commands all remain valid.

### Observation 2: Security-key requests need an executable format check

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** MCP Hub tenant-scoped credential encryption remediation.
**Skill:** Existing workflow: backend security implementation
**Type:** open-source
**Phase/Area:** Secret validation and encryption initialization

**Issue:** A credential-encryption secret may appear present while still being the wrong length or encoding for AES-256-GCM. Deferring validation until first use turns a deployment misconfiguration into an opaque runtime failure.

**Suggested improvement:** Require each new cryptographic secret to have a deterministic startup or unit-level format check that verifies exact key material requirements without printing the secret.

**Principle:** Treat security configuration as executable input validation, not as an assumption based on environment-variable presence.

### Observation 3: Public claims and calls to action need contractual tests

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** MCP Hub landing-page remediation after the comprehensive audit.
**Skill:** Existing workflow: marketing and release review
**Type:** open-source
**Phase/Area:** Public-site truthfulness

**Issue:** Unsupported production claims, dead legal links, and calls to an unowned application domain can survive ordinary visual review even when the page looks polished.

**Suggested improvement:** Add lightweight source-contract tests for every public landing page that verify owned calls to action, required SEO metadata, valid local links, and an explicit denylist of claims unsupported by the shipped product.

**Principle:** Marketing copy is a release surface: its promises, destinations, and metadata need the same regression protection as product behavior.

### Observation 4: Native build checks need an explicit resource budget

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Android native-readiness audit in a constrained development sandbox.
**Skill:** Existing workflow: native release validation
**Type:** open-source
**Phase/Area:** Gradle and Android build verification

**Issue:** A Gradle configuration task downloaded the toolchain and spawned compilation workers that exceeded the available sandbox memory, causing the workspace to reset before a native build result could be collected.

**Suggested improvement:** Separate native validation into a lightweight generation/structural phase and an explicitly budgeted full-build phase. Preflight memory, stop nonessential watchers, cap Gradle workers, and checkpoint before invoking heavyweight Android compilation.

**Principle:** A native build command is not a harmless check in constrained automation; resource limits are part of release-test design.

### Observation 5: Treat legacy-route lint debt as a security-review queue

**Status:** OPEN
**Date:** 2026-08-11
**Session context:** Final MCP Hub route-alignment and lint-zero remediation pass.
**Skill:** Existing workflow: application security audit
**Type:** open-source
**Phase/Area:** Legacy route retirement and static-analysis cleanup

**Issue:** The remaining unused values in legacy screens appeared behavior-neutral, but reviewing their surrounding code exposed device-side MCP tool execution and locally persisted HTTP, WebSocket, and stdio connection presets outside the authorized transport boundary.

**Suggested improvement:** Require the final lint-cleanup phase of a security remediation to classify each remaining legacy-route warning by capability and authorization path before deleting it. If a route reaches local execution, unscoped state, or weaker transport validation, retire or redirect it and add a source-contract regression test.

**Principle:** In legacy application surfaces, static-analysis debt can be a map of unreviewed capabilities; remove the unsafe capability before removing the warning.
