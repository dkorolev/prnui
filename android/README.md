# PRN UI for Android

An installable, offline edition of the PRN UI specimen. A native Android activity
hosts the original HTML/CSS/JavaScript in a WebView. The generated launcher icon
uses the same `favicon.svg` as the browser, including a monochrome variant for
Android's themed icons. The app requests no network or storage permissions.

## Build and install

Requirements: JDK 17, Android SDK platform 35, and build tools 35.0.0. Android
Studio can install the SDK through its SDK Manager. For command-line tools:

```sh
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=/path/to/android-sdk
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
sdkmanager 'platforms;android-35' 'build-tools;35.0.0' 'platform-tools'
./android/build-apk.sh
```

Run the build command from the repository root. The checked-in Gradle wrapper
downloads its pinned Gradle version and verifies its SHA-256 checksum. The first
build also downloads Maven dependencies; subsequent builds can use their cache.
Alternatively, open the `android/` directory in Android Studio and run `app`.

The output is **`dist/prnui.apk`**, a debug-signed APK for Android 8.0 (API 26) and
newer, supporting both ARM and x86 devices. Transfer it to the phone, open it,
allow installation from that source if Android asks, and tap **Install**. Android
owns that confirmation; an APK cannot bypass it. Launch **PRN UI** from its icon.

With a USB-connected phone that has USB debugging enabled:

```sh
adb install -r dist/prnui.apk
adb shell am start -n io.github.dkorolev.prnui/.MainActivity
```

The APK uses the build machine's standard Android debug key, stored outside this
repository in `~/.android/debug.keystore`. Keep the same key for updates. An APK
from another machine may require uninstalling the previous app first. This build
is intended for direct installation and testing; WebView debugging is enabled.
For distribution under a permanent identity, configure your private release
signing key and build `:app:assembleRelease`. Never commit signing keys.

## Behavior and implementation

- Gradle copies only `prnui.html` and `favicon.svg` into generated assets on every
  build. Edit the root HTML, then rebuild; there is no second UI copy to maintain.
- AndroidX's [WebViewAssetLoader](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)
  serves bundled content at a local HTTPS origin. Unbundled requests and
  navigation away from the specimen are blocked; no HTTP server runs.
- Back closes an open dialog, listbox, copy popover, or pinned inspector before
  returning to the launcher. The keyboard retains Android's normal Back behavior.
- Rotation keeps the live WebView, form values, and UI selections. Killing the app
  process or recreating its activity starts a fresh specimen; demo state is not
  durable storage.
- The system WebView supplies rendering, accessibility, native text selection,
  and clipboard behavior. Keep Android System WebView current: the specimen uses
  modern browser features such as `color-mix()` and `inert`.

## Verification

The existing web suite remains independent of Android tooling:

```sh
node --test test/prnui.test.mjs
```

Build, lint, and run instrumentation tests on a connected device or emulator:

```sh
cd android
./gradlew :app:assembleDebug :app:lintDebug :app:connectedDebugAndroidTest
```

Device tests launch and close their own activity. They check bundled loading,
absence of network permission, tabs, checkboxes, Back dismissal and focus,
clipboard integration, rotation, and blocked external requests. Reports are in
`app/build/reports/androidTests/connected/` and `app/build/reports/lint-results-debug.html`.
The tests do not create emulators or start servers.

On a phone, also verify:

1. Enable airplane mode, force-stop PRN UI, and launch it from its icon. All
   components and the plot should render without a loading page.
2. Follow the mobile checks in [FEATURE-DEMO.md](../FEATURE-DEMO.md). Scroll dense
   tables sideways, select a route, pin an inspector, and expand event rows.
3. Open a dialog, popover, and rich listbox in turn. Back should dismiss each,
   keeping the app open. With no overlay open, Back returns to the launcher.
4. Edit a field with the keyboard visible. Confirm it remains reachable, Back
   hides the keyboard, and rotation preserves its value.
5. Copy a value and paste it into another app. Verify the launcher icon with both
   ordinary and themed icons, and check portrait/landscape system-bar spacing.

Stop any emulator you started after testing (`adb -s SERIAL emu kill`).
