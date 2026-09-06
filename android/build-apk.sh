#!/usr/bin/env bash
set -euo pipefail
android_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$android_dir"
./gradlew --no-daemon :app:assembleDebug :app:lintDebug
mkdir -p ../dist
cp app/build/outputs/apk/debug/app-debug.apk ../dist/prnui.apk
printf 'Installable APK: %s/dist/prnui.apk\n' "$(dirname "$android_dir")"
