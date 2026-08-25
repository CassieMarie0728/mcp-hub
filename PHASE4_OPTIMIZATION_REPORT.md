# Phase 4: Route Loading and Startup Optimization

**Status:** Complete
**Date:** August 11, 2026

## Outcome

MCP Hub now uses Expo Router’s supported asynchronous route loading on **web** and during **development**. This makes Metro load route code on demand rather than eagerly keeping every route active in the development session. Expo Router’s current implementation intentionally keeps native production routes synchronous, so this phase improves web startup and development memory pressure without compromising the native release path.[1]

The work also found and corrected two routing problems that were sabotaging validation. First, the project had multiple React Navigation version families, which could split the linking context used by Expo Router and its native stack. Second, archived and development-only screen files were still living under `app/`, causing Expo Router to emit them as active routes in production exports.

| Area | Change | Result |
|---|---|---|
| Route loading | Enabled `expo-router` `asyncRoutes` for web and development | Route-level deferred loading where Expo supports it |
| Navigation runtime | Aligned all direct React Navigation dependencies to one version family | One shared linking context at runtime |
| Root navigator | Removed six registrations whose screen files were no longer active routes | Eliminated stale screen registrations |
| Route tree | Moved 22 archived screens out of `app/` | Prevented them from being exported as routes |
| Development experiments | Moved `theme-lab.tsx` out of `app/` | Prevented it from reaching production bundles |
| Regression protection | Added route-loading configuration tests | Guards against accidental rollback |

## Implementation Details

The Expo Router plugin in `app.config.ts` now uses the following strategy:

```ts
asyncRoutes: {
  default: 'development',
  web: true,
}
```

This configuration activates asynchronous routes during development on supported targets and retains them for the web production bundle. Expo documents that the feature is alpha and that native production disables the Suspense boundaries; this is why the setting deliberately does not claim a native production memory reduction.[1]

The direct React Navigation packages were aligned to the versions already resolved by Expo Router:

| Package | Resolved version |
|---|---:|
| `@react-navigation/native` | 7.2.2 |
| `@react-navigation/elements` | 2.9.15 |
| `@react-navigation/bottom-tabs` | 7.15.11 |
| `@react-navigation/native-stack` | 7.14.12 |

The previous duplicate version families were the most likely explanation for the web-only `Couldn't find a LinkingContext context` crash. After alignment, the root dashboard and an asynchronously reached Servers route both rendered without the error.

## Route-Tree Cleanup

Expo Router treats files under `app/` as route candidates. The old `app/_disabled/` folder contained 22 archived screens. A clean production export showed that those inactive files were still emitted as distinct route chunks, despite the folder name. They now live in `archive/disabled-screens/`, outside the route tree. The development-only theme laboratory now lives in `archive/dev-experiments/` for the same reason.

The clean production export confirmed that neither `/_disabled/` nor `/dev/` routes are emitted. This prevents inactive screen code from consuming build time, route metadata, initial route discovery, or downloadable web assets.

## Validation

| Validation | Result |
|---|---|
| Route-loading regression tests | Passed: 3 tests |
| Full test suite | Passed: 221 tests; 1 intentionally skipped |
| TypeScript | Passed: 0 errors |
| Resolved Expo configuration | Confirmed `asyncRoutes` for web and development |
| Clean web export | Passed; no inactive or development-only route emitted |
| Browser root route | Rendered without LinkingContext error |
| Browser Servers tab | Loaded successfully through the async route boundary |

## Important Limitation

> Native production apps do not currently receive route-level Suspense boundaries from Expo Router async routes. This phase therefore avoids promising a native-release memory drop that the platform cannot provide yet.[1]

The strongest native memory improvements remain the earlier dependency removals, avoiding duplicate runtimes, route-tree cleanup, `FlatList` virtualization, screen-level data deferral, and targeted profiling of large result payloads.

## References

[1]: https://docs.expo.dev/router/web/async-routes/ "Expo Router — Async routes"
