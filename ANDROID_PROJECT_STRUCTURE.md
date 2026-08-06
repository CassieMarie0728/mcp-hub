# Android Project Structure

This document explains the structure of the native Android project and where to find key files.

## Directory Layout

```
android/
├── app/                                    # Main application module
│   ├── build.gradle                        # App-level build configuration
│   ├── proguard-rules.pro                  # ProGuard obfuscation rules
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml         # App manifest (permissions, activities, services)
│   │   │   ├── java/
│   │   │   │   └── space/manus/mcp/hub/t20260329022456/
│   │   │   │       ├── MainActivity.kt     # Main activity (entry point)
│   │   │   │       └── MainApplication.kt  # Application class (initialization)
│   │   │   └── res/
│   │   │       ├── drawable/               # Vector drawables and images
│   │   │       ├── mipmap-*/               # App icons (various DPI)
│   │   │       ├── values/
│   │   │       │   ├── colors.xml          # Color definitions
│   │   │       │   ├── strings.xml         # String resources
│   │   │       │   └── styles.xml          # Theme and style definitions
│   │   │       ├── values-night/           # Dark mode resources
│   │   │       └── layout/                 # XML layout files
│   │   ├── debug/
│   │   │   └── AndroidManifest.xml         # Debug-specific manifest (debug activities, etc.)
│   │   └── debugOptimized/
│   │       └── AndroidManifest.xml         # Optimized debug manifest
│   └── build/
│       ├── intermediates/                  # Intermediate build artifacts
│       └── outputs/
│           ├── apk/
│           │   ├── debug/                  # Debug APKs
│           │   └── release/                # Release APKs
│           └── bundle/                     # Android App Bundles
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar              # Gradle wrapper JAR
│       └── gradle-wrapper.properties       # Gradle version specification
├── build.gradle                            # Root-level build configuration
├── settings.gradle                         # Gradle settings (module configuration)
├── gradle.properties                       # Gradle properties (SDK versions, JVM args)
├── gradlew                                 # Gradle wrapper script (Unix/Mac)
├── gradlew.bat                             # Gradle wrapper script (Windows)
└── .gitignore                              # Git ignore rules for Android
```

## Key Files Explained

### `android/build.gradle` (Root Build File)

Configures build settings for all modules:

```gradle
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath('com.android.tools.build:gradle')
    classpath('com.facebook.react:react-native-gradle-plugin')
    classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')
  }
}

allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
}
```

**When to edit:** When adding global dependencies or configuring build-wide settings.

### `android/app/build.gradle` (App Build File)

Configures the app module specifically:

```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "space.manus.mcp.hub.t20260329022456"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        debug {
            debuggable true
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // React Native and Expo
    implementation 'com.facebook.react:react-native:0.81.5'
    implementation 'expo:expo:~54.0.0'
    
    // Other dependencies...
}
```

**When to edit:** When adding app-specific dependencies, changing SDK versions, or configuring signing.

### `android/gradle.properties`

Global Gradle configuration:

```properties
# JVM memory settings
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# Parallel builds
org.gradle.parallel=true

# Android settings
android.useAndroidX=true
android.enablePngCrunchInReleaseBuilds=true

# React Native settings
reactNativeArchitectures=armeabi-v7a,arm64-v8a
newArchEnabled=true
hermesEnabled=true
edgeToEdgeEnabled=true

# Expo settings
expo.gif.enabled=true
expo.webp.enabled=true
expo.useLegacyPackaging=false
android.minSdkVersion=24
```

**When to edit:** When changing JVM memory, enabling new architecture, or adjusting build properties.

### `android/app/src/main/AndroidManifest.xml`

Declares app metadata, permissions, and components:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Permissions -->
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.RECORD_AUDIO"/>
  <uses-permission android:name="android.permission.CAMERA"/>
  
  <application
      android:name=".MainApplication"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:theme="@style/AppTheme">
    
    <!-- Activities -->
    <activity
        android:name=".MainActivity"
        android:exported="true"
        android:launchMode="singleTask">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
    
    <!-- Services -->
    <service
        android:name=".MyService"
        android:exported="false"/>
    
  </application>
</manifest>
```

**When to edit:** When adding permissions, activities, services, or broadcast receivers.

### `android/app/src/main/java/space/manus/mcp/hub/t20260329022456/MainActivity.kt`

Main activity (entry point):

```kotlin
package space.manus.mcp.hub.t20260329022456

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
  }
}
```

**When to edit:** When adding custom activity logic or lifecycle handling.

### `android/app/src/main/java/space/manus/mcp/hub/t20260329022456/MainApplication.kt`

Application class (initialization):

```kotlin
package space.manus.mcp.hub.t20260329022456

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import expo.modules.ApplicationLifecycleDispatcher

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost = ...
  
  override fun onCreate() {
    super.onCreate()
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}
```

**When to edit:** When initializing global state, setting up analytics, or configuring third-party SDKs.

### `android/app/proguard-rules.pro`

ProGuard obfuscation rules for release builds:

```proguard
# Keep app classes
-keep class space.manus.mcp.hub.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
```

**When to edit:** When adding new classes that shouldn't be obfuscated or suppressing warnings.

### `android/app/src/main/res/values/strings.xml`

String resources:

```xml
<resources>
    <string name="app_name">MCP Hub</string>
    <string name="welcome_message">Welcome to MCP Hub</string>
</resources>
```

**When to edit:** When adding or modifying user-facing strings.

### `android/app/src/main/res/values/colors.xml`

Color definitions:

```xml
<resources>
    <color name="primary">#0a7ea4</color>
    <color name="primary_dark">#0a5a7a</color>
    <color name="accent">#FF6B6B</color>
</resources>
```

**When to edit:** When customizing app colors or theming.

### `android/app/src/main/res/values/styles.xml`

Theme and style definitions:

```xml
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/accent</item>
    </style>
</resources>
```

**When to edit:** When customizing the app's visual theme.

## Build Output

After building, artifacts are located in:

```
android/app/build/outputs/
├── apk/
│   ├── debug/
│   │   └── app-debug.apk              # Debug APK (for testing)
│   └── release/
│       └── app-release.apk            # Release APK (for distribution)
└── bundle/
    └── release/
        └── app-release.aab            # Android App Bundle (for Play Store)
```

## Resource Directories

| Directory | Purpose | Example |
|-----------|---------|---------|
| `drawable/` | Vector drawables and images | `ic_home.xml`, `background.png` |
| `mipmap-*/` | App icons (various DPI) | `ic_launcher.png` (48×48, 72×72, etc.) |
| `layout/` | XML layout files | `activity_main.xml` |
| `values/` | String, color, dimension resources | `strings.xml`, `colors.xml` |
| `values-night/` | Dark mode resources | `colors.xml` (dark variants) |
| `values-*/` | Localized resources | `values-es/`, `values-fr/` |
| `raw/` | Raw binary files | `data.json`, `config.xml` |
| `menu/` | Menu definitions | `main_menu.xml` |

## Gradle Wrapper

The Gradle wrapper (`gradlew` and `gradlew.bat`) ensures everyone uses the same Gradle version:

```bash
# Unix/Mac
./gradlew build

# Windows
gradlew.bat build
```

The wrapper version is specified in `gradle/wrapper/gradle-wrapper.properties`:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-all.zip
```

## Common Modifications

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

### Change Package Name

⚠️ **Warning:** Changing the package name is complex. Use Android Studio's built-in refactoring:

1. Right-click `space.manus.mcp.hub.t20260329022456` in the project tree
2. Select **Refactor** → **Rename**
3. Choose **Rename package**
4. Enter the new package name
5. Click **Refactor**

### Add Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

Then request at runtime in your React Native code using `react-native-permissions` or similar.

## Resources

- [Android Developer Documentation](https://developer.android.com/docs)
- [Gradle Build System](https://developer.android.com/build)
- [Android Manifest Reference](https://developer.android.com/guide/topics/manifest/manifest-intro)
- [Android Resources](https://developer.android.com/guide/topics/resources/overview)
- [Kotlin Language Reference](https://kotlinlang.org/docs/reference/)
