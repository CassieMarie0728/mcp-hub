# Android Development Workflow

This guide covers the development workflow when working with the native Android project in Android Studio.

## Development Cycle

### 1. React Native Code Changes (TypeScript/React)

If you modify code in the `app/` directory (React components, screens, etc.):

```bash
# From project root
pnpm run dev:metro

# This rebuilds the Metro bundle and watches for changes
# The bundle is embedded in the APK during the next build
```

### 2. Native Code Changes (Kotlin/Java)

If you modify code in `android/app/src/main/java/`:

1. Open the file in Android Studio
2. Make your changes
3. Click **Build** → **Rebuild Project** or press `Ctrl+Shift+F9`
4. Android Studio will recompile the native code

### 3. Rebuild and Deploy

```bash
# Option 1: From Android Studio
# Click the Run button (green play icon) to build and deploy

# Option 2: From command line
./gradlew installDebug

# Option 3: Build APK for manual installation
./gradlew assembleDebug
# APK will be in: android/app/build/outputs/apk/debug/app-debug.apk
```

## Hot Reload vs. Full Rebuild

| Scenario                                         | Action                                 | Time    |
| ------------------------------------------------ | -------------------------------------- | ------- |
| React/TypeScript code change                     | Rebuild Metro bundle, then rebuild APK | 30-60s  |
| Native Kotlin/Java code change                   | Rebuild project in Android Studio      | 20-40s  |
| Resource change (strings, colors, layouts)       | Rebuild project                        | 10-20s  |
| Dependency change (package.json or build.gradle) | Clean build                            | 2-5 min |

## Debugging

### Android Studio Debugger

1. Set a breakpoint in your Kotlin/Java code by clicking the line number
2. Click **Run** → **Debug** (or press `Shift+F9`)
3. When the breakpoint is hit, you can inspect variables and step through code

### Logcat (Android Logs)

View app logs in real-time:

1. Open **View** → **Tool Windows** → **Logcat**
2. Filter by your app package: `space.manus.mcp.hub`
3. Use log levels: Verbose, Debug, Info, Warning, Error

### React Native Console Logs

React Native `console.log()` statements appear in Logcat with the tag `ReactNativeJS`.

Example:

```typescript
console.log('User clicked button'); // Appears in Logcat
```

## Profiling and Performance

### CPU Profiler

1. Open **View** → **Tool Windows** → **Profiler**
2. Click **Run** → **Profile** (or press `Ctrl+Alt+F10`)
3. Select your app and device
4. Interact with the app to record CPU usage
5. Analyze the flame chart to find bottlenecks

### Memory Profiler

1. Open the Profiler (same as above)
2. Click the **Memory** tab
3. Interact with the app to see memory allocation
4. Look for memory leaks or excessive allocations

## Testing

### Unit Tests

Add tests to `android/app/src/test/`:

```kotlin
// Example: MainActivityTest.kt
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityTest {
    @Test
    fun testAppLaunches() {
        // Test code here
    }
}
```

Run tests:

```bash
./gradlew test
```

### Instrumented Tests

Add tests to `android/app/src/androidTest/`:

```kotlin
// Example: MainActivityInstrumentedTest.kt
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.ActivityTestRule
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivityInstrumentedTest {
    @get:Rule
    val activityRule = ActivityTestRule(MainActivity::class.java)

    @Test
    fun testUIElements() {
        // UI test code here
    }
}
```

Run instrumented tests:

```bash
./gradlew connectedAndroidTest
```

## Build Variants

The project supports multiple build variants:

| Variant          | Purpose                            | Command                            |
| ---------------- | ---------------------------------- | ---------------------------------- |
| `debug`          | Development with debugging enabled | `./gradlew assembleDebug`          |
| `debugOptimized` | Development with optimizations     | `./gradlew assembleDebugOptimized` |
| `release`        | Production build (signed)          | `./gradlew assembleRelease`        |

Switch variants in Android Studio:

1. **Build** → **Select Build Variant**
2. Choose from the dropdown (e.g., `debug`, `release`)

## Gradle Build Customization

### Custom Build Logic

Edit `android/app/build.gradle` to add custom build steps:

```gradle
android {
    // ... existing config ...

    applicationVariants.all { variant ->
        variant.outputs.all { output ->
            outputFileName = "mcp-hub-${variant.name}-${new Date().format('yyyyMMdd')}.apk"
        }
    }
}
```

### Custom Gradle Tasks

Add custom tasks to `android/app/build.gradle`:

```gradle
task printBuildInfo {
    doLast {
        println "App: MCP Hub"
        println "Package: space.manus.mcp.hub"
        println "Version: ${android.defaultConfig.versionCode}"
    }
}
```

Run custom tasks:

```bash
./gradlew printBuildInfo
```

## Dependency Management

### Add a New Dependency

Edit `android/app/build.gradle`:

```gradle
dependencies {
    // Existing dependencies...

    // Add new dependency
    implementation 'com.example:library:1.0.0'
}
```

Then sync Gradle:

```bash
./gradlew build
```

### View Dependency Tree

```bash
./gradlew dependencies
```

This shows all direct and transitive dependencies.

### Resolve Dependency Conflicts

If you see version conflicts, use dependency resolution:

```gradle
dependencies {
    // Force a specific version
    implementation('com.example:library:1.0.0') {
        force = true
    }

    // Or exclude a transitive dependency
    implementation('com.example:library:1.0.0') {
        exclude group: 'com.conflicting', module: 'library'
    }
}
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/android-build.yml`:

```yaml
name: Android Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '17'
      - run: cd android && ./gradlew assembleDebug
```

## Troubleshooting

### Build Cache Issues

```bash
# Clear build cache
./gradlew clean

# Rebuild from scratch
./gradlew build
```

### Gradle Daemon Issues

```bash
# Stop all Gradle daemons
./gradlew --stop

# Rebuild
./gradlew build
```

### Dependency Resolution Issues

```bash
# Refresh dependencies
./gradlew build --refresh-dependencies

# Check for conflicts
./gradlew dependencyInsight --dependency com.example:library
```

## Advanced Topics

### Custom Native Modules

To create a custom native module:

1. Create a new Kotlin file in `android/app/src/main/java/space/manus/mcp/hub/t20260329022456/`
2. Implement the module interface
3. Register it in `MainApplication.kt`
4. Call it from React Native using `NativeModules`

See [React Native Native Modules](https://reactnative.dev/docs/native-modules-android) for details.

### ProGuard/R8 Customization

Edit `android/app/proguard-rules.pro` to customize code obfuscation:

```proguard
# Keep specific classes
-keep class com.example.MyClass { *; }

# Keep specific methods
-keepclassmembers class com.example.MyClass {
    public <methods>;
}

# Suppress warnings
-dontwarn com.example.library.**
```

## Resources

- [Android Studio User Guide](https://developer.android.com/studio/intro)
- [Gradle Build System](https://developer.android.com/build)
- [React Native Android Development](https://reactnative.dev/docs/android-setup)
- [Kotlin Language Reference](https://kotlinlang.org/docs/reference/)
- [Android Architecture Components](https://developer.android.com/topic/libraries/architecture)
