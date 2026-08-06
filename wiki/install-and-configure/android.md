---
title: Android
description: "Native Android build for MCP Hub — prerequisites, Expo config, package id, and run commands."
tags:
  - install
  - android
  - mobile
---
> [!NOTE] Status
> **Beta** (config present; not built in CI in this audit) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Build and run the Android app. |
| Audience | Mobile developers. |
| Source paths | `app.config.ts`, `package.json` (`android`), `expo-build-properties` |
| Prerequisites | JDK 17+, Android Studio + SDK, an emulator or device |
| Next | [iOS & web](ios-web.md), [Local development](local-development.md) |

## Prerequisites

| Requirement | Minimum | Notes |
| --- | --- | --- |
| JDK | 17 | Expo SDK 54 / React Native 0.81 toolchain. |
| Android SDK | platform + build-tools for target | Installed via Android Studio. |
| minSdkVersion | **24** | Set via `expo-build-properties` in `app.config.ts`. |
| Devices | emulator or USB device | `adb` available. |

## Project configuration

From `app.config.ts`:

| Setting | Value |
| --- | --- |
| Package id (`androidPackage`) | `space.manus.mcp.hub.t20260329022456` |
| minSdkVersion | `24` |
| buildArchs | `armeabi-v7a`, `arm64-v8a` |
| Permissions | `POST_NOTIFICATIONS` |
| Edge-to-edge | `true` |
| Predictive back | `false` |
| New architecture | enabled (`newArchEnabled: true`) |
| Deep links | `intentFilters` with `VIEW`, scheme from bundle id, `autoVerify: true`, categories `BROWSABLE` + `DEFAULT` |
| Adaptive icon | foreground/background/monochrome images under `assets/images/` |

The bundle id is derived from `rawBundleId = 'space.manus.mcp.hub.t20260329022456'`; the deep-link scheme is computed as `manus<timestamp>` from it (e.g. `manus20260329022456`).

## Run

```bash
corepack pnpm install
cp .env.example .env      # optional for local
corepack pnpm android     # expo run:android
```

This compiles a dev build and installs it on the connected device/emulator. First build downloads Gradle dependencies — expect several minutes.

> [!TIP]
> For a quick web preview of the same UI (no Android SDK needed), run `corepack pnpm dev:metro` and open `http://localhost:8081` — see [iOS & web](ios-web.md).

## Notes and limitations

- The app talks to the API on `localhost:3000` for dev; on a physical device, point `EXPO_PUBLIC_OAUTH_SERVER_URL` / the API base at your machine's LAN address.
- CI does **not** build Android in this audit; `pnpm android` is verified as a script only. Native SDK version bumps go through `expo` (see [Contribute](../../contribute/index.md)).

> **Next:** [iOS & web](ios-web.md)
