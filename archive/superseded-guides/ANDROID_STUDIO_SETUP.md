# Android Studio Setup Guide for MCP Hub

This guide walks you through opening and building the MCP Hub project in Android Studio as a native Android application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Android Studio** (latest version recommended) — [Download here](https://developer.android.com/studio)
- **Android SDK** (API level 24+) — Installed via Android Studio SDK Manager
- **Java Development Kit (JDK)** — Android Studio includes JDK 17 by default
- **Gradle** — Bundled with the project (`./gradlew`)
- **Node.js & pnpm** (optional, only if you plan to rebuild the React Native bundle)

## Project Structure

```
mcp-hub/
├── android/                    # Native Android project (ready for Android Studio)
│   ├── app/                    # App module
│   │   ├── build.gradle        # App-level build configuration
│   │   ├── proguard-rules.pro  # ProGuard rules for release builds
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── java/       # Kotlin/Java source code
│   │       │   └── res/        # Resources (layouts, strings, drawables)
│   │       ├── debug/
│   │       └── debugOptimized/
│   ├── build.gradle            # Root-level build configuration
│   ├── settings.gradle         # Gradle settings
│   ├── gradle.properties       # Gradle properties (SDK versions, etc.)
│   ├── gradlew                 # Gradle wrapper (Unix/Mac)
│   └── gradlew.bat             # Gradle wrapper (Windows)
├── app/                        # React Native TypeScript source
├── package.json                # Project dependencies
└── app.config.ts               # Expo configuration
```

## Opening the Project in Android Studio

### Step 1: Open Android Studio

1. Launch Android Studio
2. Click **File** → **Open**
3. Navigate to the project root directory (`/home/ubuntu/mcp-hub`)
4. Click **Open**

### Step 2: Wait for Gradle Sync

Android Studio will automatically:
- Detect the Gradle project
- Sync dependencies
- Download required SDKs and build tools

This may take 2-5 minutes on first load. You'll see a progress indicator at the bottom.

### Step 3: Configure SDK Paths (if needed)

If you see SDK warnings:

1. Go to **File** → **Project Structure**
2. Under **SDK Location**, verify:
   - **Android SDK Location** points to your SDK installation (e.g., `/home/ubuntu/Android/sdk`)
   - **JDK Location** is set to a valid JDK 11+ installation
3. Click **Apply** → **OK**

## Building the App

### Debug Build (for development)

```bash
# From the project root
./gradlew assembleDebug

# Or from Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Wait for the build to complete
# 3. APK will be in: android/app/build/outputs/apk/debug/
```

### Release Build (for production)

```bash
# Create a signed release APK
./gradlew assembleRelease

# Or use Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build Bundle(s)
# 2. Follow the signing wizard
# 3. Bundle will be in: android/app/build/outputs/bundle/release/
```

**Note:** For release builds, you'll need to configure signing credentials. See the "Signing Configuration" section below.

## Running on Device/Emulator

### Option 1: From Android Studio

1. Connect an Android device via USB (with USB debugging enabled) or start an emulator
2. Click the **Run** button (green play icon) in the toolbar
3. Select your device/emulator
4. Click **OK**

### Option 2: From Command Line

```bash
# Build and install on connected device
./gradlew installDebug

# Or with Gradle wrapper
./gradlew run
```

## Signing Configuration (Release Builds)

To create a signed release APK:

### Step 1: Generate a Keystore

```bash
keytool -genkey -v -keystore mcp-hub-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mcp-hub-key
```

This creates a `mcp-hub-release.keystore` file. **Keep this file safe** — you'll need it for future updates.

### Step 2: Configure Signing in `android/app/build.gradle`

Add the following to the `android` block:

```gradle
signingConfigs {
    release {
        storeFile file("../mcp-hub-release.keystore")
        storePassword "YOUR_STORE_PASSWORD"
        keyAlias "mcp-hub-key"
        keyPassword "YOUR_KEY_PASSWORD"
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### Step 3: Build Signed Release APK

```bash
./gradlew assembleRelease
```

The signed APK will be in `android/app/build/outputs/apk/release/app-release.apk`.

## Troubleshooting

### Gradle Sync Fails

**Problem:** "Failed to sync Gradle"

**Solution:**
1. Click **File** → **Invalidate Caches** → **Invalidate and Restart**
2. Delete `android/.gradle` directory
3. Run `./gradlew clean` from the `android/` directory
4. Resync Gradle in Android Studio

### Build Fails with "Cannot find symbol"

**Problem:** Compilation errors about missing classes

**Solution:**
1. Ensure all dependencies are up-to-date: `./gradlew dependencies`
2. Check that `node_modules/` is populated: `pnpm install` from project root
3. Rebuild the Metro bundle: `pnpm run dev:metro`

### Device Not Detected

**Problem:** "No devices found" when trying to run

**Solution:**
1. Ensure USB debugging is enabled on your device
2. Run `adb devices` to check connection
3. Install Android Debug Bridge (ADB): `sudo apt-get install android-tools-adb`
4. Restart ADB: `adb kill-server && adb start-server`

### Out of Memory Error

**Problem:** "java.lang.OutOfMemoryError" during build

**Solution:** Increase Gradle heap size in `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## Customizing the Build

### Change App Name

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<application android:label="@string/app_name" ... >
```

Then update `android/app/src/main/res/values/strings.xml`:

```xml
<string name="app_name">Your App Name</string>
```

### Change App Icon

Replace the icon files in `android/app/src/main/res/`:

- `mipmap-hdpi/ic_launcher.png` (72×72)
- `mipmap-mdpi/ic_launcher.png` (48×48)
- `mipmap-xhdpi/ic_launcher.png` (96×96)
- `mipmap-xxhdpi/ic_launcher.png` (144×144)
- `mipmap-xxxhdpi/ic_launcher.png` (192×192)

### Change Minimum SDK Version

Edit `android/gradle.properties`:

```properties
android.minSdkVersion=24  # Change to your desired minimum API level
```

## Native Development

If you need to add custom native code:

1. Create a new file in `android/app/src/main/java/space/manus/mcp/hub/t20260329022456/`
2. Write your Kotlin or Java code
3. Reference it from React Native using the [React Native Native Modules API](https://reactnative.dev/docs/native-modules-android)

## Rebuilding the React Native Bundle

If you modify TypeScript/React code in the `app/` directory, rebuild the bundle:

```bash
# From project root
pnpm run dev:metro

# Or build for production
pnpm exec expo export:embed
```

The bundle will be embedded in the APK during the next build.

## Performance Optimization

### Enable ProGuard/R8 Minification

Already configured in `android/app/build.gradle` for release builds. ProGuard rules are in `android/app/proguard-rules.pro`.

### Enable Hermes Engine

Hermes is already enabled in `android/gradle.properties`:

```properties
hermesEnabled=true
```

This reduces APK size and improves startup time.

### Enable New Architecture

React Native's new architecture (Fabric + TurboModules) is enabled:

```properties
newArchEnabled=true
```

## Useful Gradle Commands

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run tests
./gradlew test

# Check dependencies
./gradlew dependencies

# Lint code
./gradlew lint

# Build and install on device
./gradlew installDebug

# View all available tasks
./gradlew tasks
```

## Next Steps

1. **Customize the app** — Modify `app/` source files and rebuild
2. **Add native modules** — Create custom Kotlin/Java code as needed
3. **Test on real device** — Connect an Android phone and deploy
4. **Prepare for release** — Follow the "Signing Configuration" section
5. **Publish to Play Store** — Use Android Studio's built-in publishing tools

## Resources

- [Android Studio Documentation](https://developer.android.com/studio/intro)
- [React Native Android Guide](https://reactnative.dev/docs/android-setup)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Gradle Documentation](https://gradle.org/guides/)
- [Android Developers Guide](https://developer.android.com/guide)

## Support

For issues or questions:

1. Check the [Expo Documentation](https://docs.expo.dev/)
2. Review [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
3. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/android) for similar issues
4. Check the [Android Studio Release Notes](https://developer.android.com/studio/releases)
