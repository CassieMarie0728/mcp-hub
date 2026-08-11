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
