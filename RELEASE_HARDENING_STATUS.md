# Release Hardening Status

**Last updated:** 2026-08-11

## Completed in This Pass

| Area | Change | Verification |
|---|---|---|
| Direct WebSocket exposure | Removed unused `socket.io` and `socket.io-client` dependencies. The dormant hook and server manager are retained as non-compiling reference artifacts under `archive/disabled-realtime/`. | Source trace, dependency contract test, full test suite, type check, and backend bundle pass. |
| CI reproducibility | Replaced permissive dependency installation with `pnpm install --frozen-lockfile`. | CI workflow contract test. |
| CI release gate | Added backend bundle generation after type checking, linting, and tests. | CI workflow contract test and local bundle pass. |
| Expo alignment | Aligned the requested Expo SDK 54 modules and added `expo-font` and `expo-web-browser` configuration plugins. | Installed package verification and `expo install --check`. |

## Current Release Signals

| Signal | Current state | Release interpretation |
|---|---|---|
| Unit tests | 262 passing; 1 intentionally skipped | Green for covered behavior. |
| TypeScript | Passes with zero errors | Green. |
| Backend bundle | Passes | Green. |
| Direct Socket.IO path | Removed | The prior Socket.IO/Engine.IO WebSocket advisory path no longer ships as a direct project dependency. |
| Expo dependency check | Three React Navigation advisory warnings remain | Amber: evaluate on native devices before a production mobile release. |
| Production audit | 2 critical, 28 high, 16 moderate, and 5 low advisory records remain | Red for a production release until upstream/toolchain paths are either remediated or accepted with documented compensating controls. |

## Remaining Dependency Risk

The remaining audit records are primarily transitive paths through the Expo CLI/Metro toolchain, React Native developer tooling, and NativeWind/Tailwind build tooling. The audit also identifies paths through Express dependencies such as `qs` and `body-parser`. This pass did not apply broad overrides or major framework upgrades because forcing them can invalidate Expo SDK 54 compatibility, alter package-manager resolution in ways the framework has not tested, or create a deceptively green audit while breaking runtime behavior.

The next dependency decision should be made as a controlled compatibility pass: map each advisory to a runtime versus development-only path, test a narrowly scoped direct upgrade where a safe target exists, and reserve overrides for packages whose upstream peer ranges explicitly permit the patched version.

## React Navigation Advisory Drift

Expo SDK validation currently recommends lower React Navigation versions than the project’s intentionally unified 7.x family. The installed family is internally consistent and the current application type checks, tests, and bundles successfully. This is **not** a waiver to ignore native behavior: the next release gate should run the connection, onboarding, tab navigation, and deep-link flows on an Android device or emulator before publishing.

## Required Next Gate

Do not treat the app as production-ready solely because the test suite is green. Before publishing, perform a targeted Android native smoke test and an advisory-by-advisory dependency review. The broken stuff is no longer hiding behind a fake Socket.IO feature, but the wider framework supply chain still needs deliberate work.
