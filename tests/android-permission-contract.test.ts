import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appConfig = readFileSync(resolve(root, "app.config.ts"), "utf8");
const manifest = readFileSync(resolve(root, "android/app/src/main/AndroidManifest.xml"), "utf8");

describe("Android permission contract", () => {
  it("retains only the active notification capability and excludes unused audio and video capabilities", () => {
    expect(manifest).toContain('android.permission.POST_NOTIFICATIONS');
    expect(manifest).not.toContain('android.permission.RECORD_AUDIO');
    expect(manifest).not.toContain('android.permission.FOREGROUND_SERVICE');
    expect(manifest).not.toContain('ExpoVideoPlaybackService');
    expect(manifest).not.toContain('android:supportsPictureInPicture="true"');
    expect(appConfig).not.toContain("'expo-audio'");
    expect(appConfig).not.toContain("'expo-video'");
  });
});
