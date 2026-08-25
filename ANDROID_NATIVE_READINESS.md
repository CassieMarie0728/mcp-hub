# Android Native Readiness

**Status:** The Android Studio project is now **reproducibly generated and structurally verified**. A full Gradle APK build still requires a provisioned Android SDK runner with enough memory for the React Native/Expo Kotlin toolchain.

## What Exists

The repository now contains the generated `android/` project, including the Gradle wrapper, root and app build files, manifest, generated Kotlin application/activity sources, and launcher assets. It is generated from the Expo configuration with:

```bash
pnpm exec expo prebuild --platform android --clean --no-install
```

The lightweight structural check verifies that these files exist:

| Required native artifact | Status |
|---|---|
| `android/gradlew` | Present |
| `android/app/build.gradle` | Present |
| `android/app/src/main/AndroidManifest.xml` | Present |
| Android permission regression contract | Passing |

## Permission Scope

The unused Audio and Video Expo modules were removed before regeneration. As a result, the generated manifest no longer requests microphone, foreground media-service, or picture-in-picture capabilities. The active notification capability remains declared because the product still imports the notification feature.

| Capability | Current state |
|---|---|
| Internet access | Retained for backend and MCP connectivity |
| Notifications | Retained for the active notification feature |
| Microphone recording | Removed |
| Foreground media playback | Removed |
| Video playback service | Removed |
| Picture-in-picture | Removed |

## Android Studio / Runner Verification

Open the `android/` directory in Android Studio after installing an Android SDK compatible with the generated Gradle configuration. Then execute:

```bash
cd android
./gradlew :app:assembleDebug --no-daemon -Dorg.gradle.workers.max=2
```

The constrained worker count is deliberate. A previous configuration-only Gradle invocation exceeded the sandbox memory budget while compiling Expo and React Native Kotlin build logic. That result is an infrastructure constraint, not evidence that the project cannot build; it is also not a substitute for a real device or emulator test.

## Required Native Smoke Test

Before publishing an Android build, verify portrait launch, onboarding dismissal and replay, tab navigation, an invalid HTTPS MCP endpoint error, a valid connection test, tool discovery, server deletion, and notification permission behavior on an emulator or physical device. Keep OAuth, webhooks, and workflows unavailable until their durable tenant-scoped implementations land.
