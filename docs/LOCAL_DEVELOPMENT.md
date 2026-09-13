# Local development

## Status

The JavaScript foundation was verified on 2026-09-13 with Node 24.13.0 and npm
11.6.2. The repository pins its supported Node baseline in `.nvmrc`; clean-machine
and physical-device verification remain Phase 1 exit work.

## Required tooling

- macOS capable of running the supported Xcode version for iOS development.
- Android Studio, the supported Android SDK/NDK, and a physical Android device.
- Current supported Node.js LTS, selected package manager, Java, CocoaPods, Expo
  CLI through `npx`, and EAS CLI only where the workflow requires it.
- A physical iPhone and Apple development signing access.

Pin Node and package-manager versions in the repository and commit the lockfile.
Pin native build requirements through the project configuration rather than this
document alone.

## Intended workflow

1. Install the pinned toolchain and dependencies.
2. Copy documented example environment files; never copy production secrets.
3. Generate or synchronize native projects using the repository script.
4. Build a development client; do not use Expo Go as validation.
5. Start the bundler and install on a physical Android or iOS device.
6. Verify camera capture, offline OCR model availability, encrypted local export,
   and absence of analytics network traffic.
7. Run formatting, lint, typecheck, unit tests, and focused native tests.

Verified foundation commands:

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run format:check
npx expo config --type public
npx expo install --check
```

## Configuration rules

- No Firebase configuration, service-account key, analytics credential, or server
  credential belongs in the mobile application.
- Local diagnostics remain disabled by default in development and production.

## Remaining setup verification

The mobile engineering owner must verify `npm run prebuild`, `npm run android`,
and `npm run ios` on clean native toolchains and physical devices before Phase 1
exit. If generation fails, preserve the app-private data model, revert generated
native directories, correct the config plugin or pinned dependency, and regenerate.
Camera, OCR, PDF, corpus, and native clean-build commands will be added only when
their approved dependencies land.
