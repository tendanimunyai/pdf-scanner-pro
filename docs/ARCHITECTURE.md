# Architecture

## Status

This is the provisional MVP architecture. Decisions involving native libraries
remain conditional on the pass criteria in `TECHNICAL_SPIKES.md`.

## Decisions

- Use React Native, TypeScript, and the current supported Expo SDK.
- Use Expo development builds and Continuous Native Generation/config plugins.
  Expo Go is not a supported development or test environment because the product
  requires custom native camera, imaging, OCR, PDF, and encryption
  capabilities.
- Keep `android/` and `ios/` reproducible from configuration where practical.
  Native edits that cannot be expressed through a local Expo module or config
  plugin must be documented and tested against regeneration.
- Use `expo-camera` for the initial capture spike. Replace or extend it only if
  frame access, focus/exposure control, burst capture, or performance requirements
  cannot be met.
- Implement document detection, perspective correction, quality analysis, and
  full-resolution filters through a local native imaging module, provisionally
  backed by OpenCV.
- Use Apple Vision for iOS OCR and bundled Google ML Kit Text Recognition v2 for
  Android OCR. Bundling is required for guaranteed first-run offline behavior.
- Select the PDF engine only after proving searchable text placement, Unicode,
  cancellation, memory use, licensing, and cross-viewer compatibility.
- Store files in app-private storage and metadata/search state in SQLite. The
  encryption approach must pass the encryption spike before schema stabilization.
- Keep operational measurements local through an internal typed adapter. Remote
  analytics must never be a dependency of scanner domain logic.

Official technical references:

- [Expo development builds](https://docs.expo.dev/develop/development-builds/faq/)
- [Expo custom native code](https://docs.expo.dev/workflow/customizing/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Apple Vision](https://developer.apple.com/documentation/vision)

## Component boundaries

```text
Screens / navigation
        |
Application use cases and persisted jobs
        |
Scanner domain models and coordinate transforms
        |
Camera | Imaging | OCR | PDF | Storage | Local diagnostics adapters
        |
iOS and Android native implementations
```

Suggested source layout:

```text
src/
  app/             navigation and application composition
  features/        capture, review, OCR review, library, export
  domain/          document/page models, jobs, transforms, validation
  services/        provider-independent interfaces and orchestration
  infrastructure/  SQLite, filesystem, diagnostics and adapter bindings
  ui/              shared components, theme and accessibility helpers
modules/            local Expo native modules and config plugins
```

Screens may invoke application use cases, but must not directly coordinate native
OCR, files, SQL, PDF generation, or diagnostics persistence directly.

## Coordinate model

Every geometric value must identify its coordinate space and dimensions:

- camera sensor pixels;
- preview/view coordinates;
- source-image pixels after EXIF orientation;
- processed-page pixels after crop and perspective transform;
- normalized OCR coordinates; and
- PDF points after page scaling and origin conversion.

Transforms are immutable, composable, serializable, and unit tested. OCR results
must either be generated on the final page or carry the complete transform needed
to map them to it.

## Processing model

- Preview analysis is throttled and uses latest-frame backpressure.
- Full-resolution processing starts only for a retained page.
- OCR and export run as persisted, cancellable jobs with bounded concurrency.
- Job completion is idempotent. A retry may replace the same derivative but must
  not add another page or document.
- Write derived files to a temporary path, verify them, atomically promote them,
  then update SQLite.
- Reconcile database records and files after abnormal termination.

## Data ownership

The source image is authoritative. Crop, rotation, filter, OCR, and export are
derivatives. Page order is stored by stable page ID plus explicit position; paths
and array indexes are never identity.

## Error taxonomy

Use typed, allowlisted codes such as permission denied, camera unavailable, blur,
model unavailable, processing failed, storage full, export cancelled, and invalid
input. Raw native errors stay in local redacted diagnostic logs and never enter
diagnostics or user-facing copy.

## Open decisions

- Camera library suitability for real-time frames and burst selection.
- OpenCV distribution, binary-size impact, and license obligations.
- PDF engine and Unicode font/subsetting strategy.
- SQLCipher versus encrypted files/fields and search-index implications.
- Background execution limits and recovery behavior on each platform.
- Minimum OS versions after dependency and reference-device validation.
