# Local development

## Status

Commands and exact versions will be finalized when the application is scaffolded.
Do not invent setup steps that have not been verified in a clean checkout.

## Required tooling

- macOS capable of running the supported Xcode version for iOS development.
- Android Studio, the supported Android SDK/NDK, and a physical Android device.
- Current supported Node.js LTS, selected package manager, Java, CocoaPods, Expo
  CLI through `npx`, and EAS CLI only where the workflow requires it.
- A physical iPhone and Apple development signing access.
- Firebase development project with Android/iOS apps and Analytics enabled.

Pin Node and package-manager versions in the repository and commit the lockfile.
Pin native build requirements through the project configuration rather than this
document alone.

## Intended workflow

1. Install the pinned toolchain and dependencies.
2. Copy documented example environment files; never copy production secrets.
3. Obtain ignored development Firebase native configuration through the approved
   team channel.
4. Generate or synchronize native projects using the repository script.
5. Build a development client; do not use Expo Go as validation.
6. Start the bundler and install on a physical Android or iOS device.
7. Verify camera capture, offline OCR model availability, local export, and
   development Analytics debug events.
8. Run formatting, lint, typecheck, unit tests, and focused native tests.

## Configuration rules

- Development and production use separate Firebase projects/data streams.
- Firebase configuration files are ignored unless a reviewed policy explicitly
  establishes that a non-secret generated file may be committed.
- No service-account key or server credential belongs in the mobile application.
- Analytics collection follows consent configuration even in development; debug
  mode changes visibility, not privacy rules.

## To complete during scaffolding

Replace this section with verified commands for install, prebuild, Android/iOS
development builds, tests, lint, typecheck, corpus tests, native clean builds, and
troubleshooting. Add a clean-machine verification date and owner.
