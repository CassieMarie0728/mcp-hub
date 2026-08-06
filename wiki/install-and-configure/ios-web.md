---
title: iOS & Web
description: "iOS native builds (macOS/Xcode only) and the Expo static web output — configuration and commands."
tags:
  - install
  - ios
  - web
---
> [!NOTE] Status
> **iOS: Beta** (needs macOS/Xcode, not built in CI) · **Web: Stable** (Expo static output, dev server verified) · Last verified 2026-08-06 · Commit `0691562`

| Field | Value |
| --- | --- |
| Purpose | Build the iOS app and serve the web client. |
| Audience | Mobile + web developers. |
| Source paths | `app.config.ts`, `package.json` (`dev:metro`, `ios`, `setup:github-pages`) |
| Prerequisites | iOS: macOS + Xcode. Web: Node + pnpm only. |
| Next | [Local development](local-development.md), [Docker & Kubernetes](../../install-and-configure/docker.md) |

## iOS

Native iOS builds require **macOS with Xcode** (React Native does not compile iOS on Windows/Linux).

| Setting | Value |
| --- | --- |
| Bundle identifier | `space.manus.mcp.hub.t20260329022456` |
| Deployment | `supportsTablet: true` |
| Encryption exemption | `ITSAppUsesNonExemptEncryption: false` in `infoPlist` |
| Architecture | New architecture enabled |

```bash
corepack pnpm ios      # expo run:ios
```

`expo run:ios` requires a booted simulator or a connected device and a valid signing setup.

## Web

The web target uses **Metro as the bundler with static output** (`app.config.ts`: `web.bundler: 'metro'`, `web.output: 'static'`) plus React Native Web (~0.21.2).

### Local dev

```bash
corepack pnpm dev:metro     # expo start --web --port ${EXPO_PORT:-8081}
```

Opens the client at `http://localhost:8081`. The API server must be running on port `3000` (see [Local development](local-development.md)).

### Static hosting

The repo includes GitHub Pages helpers:

| Script | Purpose |
| --- | --- |
| `pnpm setup:github-pages` | Node implementation (`scripts/setup-github-pages.js`). |
| `pnpm setup:github-pages:bash` | Bash implementation (`scripts/setup-github-pages.sh`). |

For a plain static export run Expo's `npx expo export --platform web` and serve the `dist/` output.

> [!NOTE]
> The web client is a dev-serving and static-export target. The Express container serves the `landing/` page and the API; it does **not** host the exported Expo web app by default — plan your web hosting separately (see [Docker & Kubernetes](../../install-and-configure/docker.md)).

> **Next:** [Docker & Kubernetes](../../install-and-configure/docker.md)
