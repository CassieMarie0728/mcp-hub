# Android Native Development Guide

This is your complete guide to transitioning from Expo to full native Android Studio development.

## What's Been Prepared

✅ **Native Android Project Generated**
- Full Android project structure in `/android/` directory
- Gradle build system configured and ready
- All necessary gradle files (build.gradle, settings.gradle, gradle.properties)
- ProGuard rules configured for production builds
- AndroidManifest.xml with all required permissions and configurations

✅ **Native Source Code**
- `MainActivity.kt` — Main activity (entry point)
- `MainApplication.kt` — Application initialization
- All React Native integration code

✅ **Build Configuration**
- Debug and Release build types
- Hermes engine enabled for better performance
- New Architecture (Fabric + TurboModules) enabled
- Edge-to-edge display support
- WebP and GIF image support

✅ **Documentation**
- `ANDROID_STUDIO_SETUP.md` — Step-by-step setup guide
- `ANDROID_DEVELOPMENT.md` — Development workflow and debugging
- `ANDROID_PROJECT_STRUCTURE.md` — Directory structure and file reference

## Quick Start

### 1. Install Android Studio

Download from: https://developer.android.com/studio

### 2. Open the Project

1. Launch Android Studio
2. Click **File** → **Open**
3. Navigate to `/home/ubuntu/mcp-hub`
4. Click **Open**
5. Wait for Gradle sync to complete (2-5 minutes)

### 3. Build and Run

**Debug Build (for testing):**
```bash
cd /home/ubuntu/mcp-hub/android
./gradlew assembleDebug
```

APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

**Or from Android Studio:**
1. Connect an Android device or start an emulator
2. Click the **Run** button (green play icon)
3. Select your device
4. Click **OK**

### 4. Release Build (for distribution)

```bash
# Create a keystore (one-time)
keytool -genkey -v -keystore mcp-hub-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias mcp-hub-key

# Build signed APK
cd /home/ubuntu/mcp-hub/android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
mcp-hub/
├── android/                    # ← Native Android project (ready for Android Studio)
│   ├── app/
│   │   ├── build.gradle        # App build configuration
│   │   ├── proguard-rules.pro  # Code obfuscation rules
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml
│   │       │   ├── java/space/manus/mcp/hub/t20260329022456/
│   │       │   │   ├── MainActivity.kt
│   │       │   │   └── MainApplication.kt
│   │       │   └── res/        # Resources (strings, colors, icons, layouts)
│   │       └── debug/
│   ├── build.gradle            # Root build configuration
│   ├── gradle.properties       # Build properties (SDK versions, JVM args)
│   ├── gradlew                 # Gradle wrapper (Unix/Mac)
│   └── gradlew.bat             # Gradle wrapper (Windows)
├── app/                        # React Native TypeScript source
├── package.json
├── app.config.ts
└── ANDROID_*.md                # Documentation files
```

## Development Workflow

### When You Modify React/TypeScript Code

1. Update code in `app/` directory
2. Rebuild Metro bundle:
   ```bash
   pnpm run dev:metro
   ```
3. Rebuild Android project:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
4. Deploy to device/emulator

### When You Modify Native Code

1. Update Kotlin/Java code in `android/app/src/main/java/`
2. In Android Studio: **Build** → **Rebuild Project** (Ctrl+Shift+F9)
3. Run the app

### When You Add Dependencies

**JavaScript/React Native:**
```bash
pnpm add some-package
pnpm run dev:metro  # Rebuild bundle
cd android && ./gradlew assembleDebug
```

**Android/Gradle:**
1. Edit `android/app/build.gradle`
2. Add dependency to `dependencies` block
3. In Android Studio: **File** → **Sync Now**

## Key Files Reference

| File | Purpose | Edit When |
|------|---------|-----------|
| `android/app/build.gradle` | App build config | Adding dependencies, changing SDK versions |
| `android/gradle.properties` | Build properties | Changing JVM memory, enabling features |
| `android/app/src/main/AndroidManifest.xml` | App metadata | Adding permissions, activities, services |
| `android/app/src/main/java/.../MainActivity.kt` | Main activity | Adding custom activity logic |
| `android/app/src/main/java/.../MainApplication.kt` | App initialization | Setting up global state, analytics |
| `android/app/proguard-rules.pro` | Code obfuscation | Adding classes to keep, suppressing warnings |
| `android/app/src/main/res/values/strings.xml` | String resources | Adding user-facing text |
| `android/app/src/main/res/values/colors.xml` | Color definitions | Customizing app colors |

## Common Tasks

### Change App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">My New App Name</string>
```

### Change App Icon

Replace files in `android/app/src/main/res/mipmap-*/`:
- `mipmap-mdpi/ic_launcher.png` (48×48)
- `mipmap-hdpi/ic_launcher.png` (72×72)
- `mipmap-xhdpi/ic_launcher.png` (96×96)
- `mipmap-xxhdpi/ic_launcher.png` (144×144)
- `mipmap-xxxhdpi/ic_launcher.png` (192×192)

### Add Permissions

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

Then request at runtime in your React Native code.

### Create Custom Native Module

1. Create a new Kotlin file in `android/app/src/main/java/space/manus/mcp/hub/t20260329022456/`
2. Implement the module
3. Register in `MainApplication.kt`
4. Call from React Native using `NativeModules`

See [React Native Native Modules](https://reactnative.dev/docs/native-modules-android) for details.

## Debugging

### View Logs

In Android Studio:
1. **View** → **Tool Windows** → **Logcat**
2. Filter by package: `space.manus.mcp.hub`
3. View real-time logs

### Debug with Breakpoints

1. Set a breakpoint in Kotlin/Java code (click line number)
2. **Run** → **Debug** (Shift+F9)
3. Interact with app to hit breakpoint
4. Step through code and inspect variables

### Profile Performance

1. **View** → **Tool Windows** → **Profiler**
2. **Run** → **Profile** (Ctrl+Alt+F10)
3. Interact with app
4. Analyze CPU, memory, and network usage

## Build Variants

| Variant | Purpose | Command |
|---------|---------|---------|
| `debug` | Development with debugging | `./gradlew assembleDebug` |
| `debugOptimized` | Development with optimizations | `./gradlew assembleDebugOptimized` |
| `release` | Production (signed) | `./gradlew assembleRelease` |

Switch in Android Studio: **Build** → **Select Build Variant**

## Gradle Commands

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build and install on device
./gradlew installDebug

# Run tests
./gradlew test

# View dependencies
./gradlew dependencies

# Clean build
./gradlew clean

# Rebuild project
./gradlew build
```

## Troubleshooting

### Gradle Sync Fails
```bash
# Clear cache and resync
cd android
rm -rf .gradle build
./gradlew clean
```

### Build Fails with "Cannot find symbol"
```bash
# Rebuild dependencies
pnpm install
pnpm run dev:metro
cd android && ./gradlew clean build
```

### Device Not Detected
```bash
# Check ADB connection
adb devices

# Restart ADB
adb kill-server && adb start-server

# Enable USB debugging on device
```

### Out of Memory Error
Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## Next Steps

1. **Open in Android Studio** — Follow the "Quick Start" section above
2. **Build and test** — Run the debug APK on a device or emulator
3. **Customize** — Change app name, icon, colors, and theme
4. **Add features** — Modify React/TypeScript code or create native modules
5. **Prepare for release** — Generate signed APK for distribution

## Documentation Files

- **ANDROID_STUDIO_SETUP.md** — Detailed setup and build instructions
- **ANDROID_DEVELOPMENT.md** — Development workflow, debugging, testing
- **ANDROID_PROJECT_STRUCTURE.md** — Directory structure and file reference

## Resources

- [Android Studio Documentation](https://developer.android.com/studio/intro)
- [React Native Android Guide](https://reactnative.dev/docs/android-setup)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)
- [Gradle Documentation](https://gradle.org/guides/)
- [Android Developers Guide](https://developer.android.com/guide)

---

**Ready to go native?** Open `ANDROID_STUDIO_SETUP.md` for step-by-step instructions!
