# PDF Scanner Pro — engineering steering

## Product boundary

PDF Scanner Pro is a privacy-focused mobile application for capturing paper
documents with a phone camera, correcting and enhancing page images, recognizing
printed text with on-device OCR, and exporting searchable PDF files.

Treat this repository as a sensitive-document application. Prefer correctness,
privacy, offline reliability, image fidelity, and recoverability over speed of
feature delivery.

## Source of truth

- Product and technical requirements: `REQUIREMENTS.md`
- Google Play positioning and analytics: `docs/GOOGLE_PLAY_ASO.md`
- Architecture and boundaries: `docs/ARCHITECTURE.md`
- Delivery scope: `docs/MVP_DELIVERY_PLAN.md`
- Privacy and lifecycle: `docs/PRIVACY_AND_DATA_FLOW.md`
- Test and benchmark execution: `docs/TEST_STRATEGY.md`
- Permissions: `docs/PERMISSIONS_MATRIX.md`
- Dependency approval: `docs/DEPENDENCY_AND_LICENSE_REVIEW.md`
- Local setup: `docs/LOCAL_DEVELOPMENT.md`
- UX states and recovery: `docs/UX_FLOWS.md`
- Release controls: `docs/RELEASE_AND_ROLLBACK.md`
- Application code: `src/` once created
- Native platform code: `android/` and `ios/` when generated
- Automated tests: colocated tests or the repository's established test folders
- Local setup and release procedures: `docs/`

Read `REQUIREMENTS.md` before changing camera capture, image processing, OCR,
PDF generation, storage, permissions, privacy, or export behavior. Update it in
the same change when product behavior or scope changes.

## Product invariants

1. Core camera scanning, page editing, OCR, local search, and PDF export work
   without an account or network connection.
2. Document images, OCR text, thumbnails, filenames, and PDFs remain on the
   device unless the user explicitly exports or opts into a future cloud feature.
3. Never discard a source page until its replacement or exported PDF has been
   written successfully and validated.
4. Persist an in-progress scan after every captured, imported, reordered, edited,
   or deleted page so it can recover after interruption.
5. An exported searchable PDF must retain readable page images and align its
   invisible OCR text layer with the final crop, rotation, scale, and page size.
6. Manual crop, rotation, and capture remain available when automatic detection,
   auto-capture, orientation detection, or OCR fails.
7. Destructive redaction must remove both visible image pixels and corresponding
   OCR text. A visual overlay alone is not a safe redaction.
8. Never claim handwriting support, legal certification, or guaranteed OCR
   accuracy unless the documented product scope and validation support it.

## Security and privacy

- Never commit `.env`, signing keys, provisioning profiles, service credentials,
  API tokens, keystore passwords, or production configuration containing secrets.
- Public client configuration must not contain a private credential, regardless
  of its environment-variable prefix.
- Do not log, upload, or include in crash reports any document image, OCR text,
  PDF content, filename, contact detail, or persistent local file path.
- Store scans in app-private storage by default. Use the platform share sheet or
  file picker only after an explicit user action.
- Request camera, photo-library, notification, biometric, and file permissions
  only when their associated feature is invoked. Explain denied and restricted
  states and provide a safe fallback where possible.
- Remove abandoned temporary processing files without deleting recoverable scan
  sessions or successfully saved documents.
- Validate imported file types, dimensions, page counts, and resource usage.
  Treat malformed images and PDFs as untrusted input.
- If cloud features are introduced, require explicit opt-in, least-privilege
  access, encryption in transit and at rest, tenant isolation, deletion controls,
  retention rules, and a documented threat model.
- Analytics must be optional where required by law, have a documented purpose,
  and contain only privacy-safe operational metadata.

## Google Analytics requirement

Set up Google Analytics for every runnable application created in this repository
and preserve it through Android and iOS releases. Use Firebase Analytics where it
is the supported mobile integration, with separate development and production
configuration and data streams.

- Add analytics during initial application scaffolding rather than as a release
  afterthought.
- Analytics setup is incomplete until development events are visible in a debug
  or development property and production configuration is documented.
- Obtain consent before collection where required by platform policy or applicable
  law. Respect denial, withdrawal, child-directed treatment, and restricted
  tracking states without degrading scanning, OCR, local storage, or PDF export.
- Disable analytics collection by default until the consent state is resolved in
  jurisdictions or configurations that require prior consent.
- Use an allowlisted analytics wrapper. Screens and features must not call the
  provider SDK directly.
- Maintain a typed event catalog with event name, purpose, trigger, parameters,
  retention need, owner, and validation method.
- Never send document images, PDFs, OCR text, extracted fields, filenames, user
  titles, contact details, file paths, cloud destination names, or raw error text.
- Never use advertising identifiers or document-derived fingerprints for product
  analytics.
- Use random installation/session identifiers only where necessary, document
  their lifecycle, and provide deletion or reset behavior where applicable.
- Keep event and parameter names stable. Version intentional semantic changes
  rather than silently changing an existing metric.
- Validate analytics on both Android and iOS and confirm release builds do not
  emit debug traffic.
- Keep Google Play Data safety declarations, privacy documentation, consent UI,
  SDK behavior, and actual collection consistent.

At minimum, instrument the privacy-safe funnel defined in
`docs/GOOGLE_PLAY_ASO.md`: first open, permission outcome, scan started, first
page captured, quality outcome, OCR outcome, export started, export outcome, and
first successful export. Operational duration, page-count bands, failure codes,
app version, platform, and coarse device-performance class may be recorded; page
content and user-entered values may not.

## Camera and image-processing rules

- Keep raw capture coordinates, preview coordinates, processed-image coordinates,
  and PDF coordinates distinct and convert between them through tested utilities.
- Account for EXIF orientation, sensor rotation, mirrored previews, device
  orientation, crop transforms, and pixel density before applying detected edges
  or OCR bounding boxes.
- Perform expensive frame analysis off the UI thread and bound its frequency,
  memory use, and queue depth.
- Auto-capture must require a stable, sufficiently sharp document and must provide
  clear feedback. It must not trap the user in repeated captures.
- Preserve the highest useful source resolution until export succeeds. Derive
  previews and thumbnails separately rather than repeatedly recompressing sources.
- Image filters must not silently erase faint text, signatures, stamps, or colored
  content. Always retain an original or reversible edit state.
- Every native image buffer, temporary bitmap, camera stream, and processing task
  must be released or cancelled when its screen unmounts or the app backgrounds.
- Test low light, glare, blur, shadows, skew, colored paper, receipts, small fonts,
  multiple aspect ratios, and documents on low-contrast backgrounds.

## OCR rules

- OCR must run on the final processed page orientation or map its results through
  every subsequent transform.
- Keep recognized text, confidence where available, language, page association,
  and bounding geometry together in a versioned representation.
- A failed or low-confidence page must remain exportable as an image and expose a
  retry path. OCR failure must not destroy a scan.
- Language support must be explicit. Do not silently send a page to a server or
  download a language model without clear user-facing behavior.
- Normalize text for indexing without replacing the original OCR output needed
  for copying, review, or PDF placement.
- Search indexes must be deleted when their owning page or document is deleted.
- Evaluate OCR accuracy against a fixed, versioned corpus; do not rely on a few
  hand-selected screenshots.

## PDF and export rules

- Generate a standards-compliant PDF that opens in representative iOS, Android,
  macOS, Windows, and browser viewers.
- Preserve page order, requested page size, aspect ratio, orientation, and quality.
- Verify that searchable text can be selected and copied in reading order and
  that it corresponds to the visible page.
- Generate exports in a temporary destination, validate completion, then move or
  share the completed file. Never expose a partially written PDF as successful.
- Handle cancellation, backgrounding, low storage, memory pressure, and sharing
  failure without losing the underlying scan.
- Sanitize filenames for each supported platform while preserving the user-facing
  document title.
- Compression must be bounded and must not make text materially unreadable.
- Password protection, encryption, digital signatures, and archival PDF profiles
  require dedicated requirements and interoperability tests before being claimed.

## Local data and migrations

- Use stable identifiers for documents and pages. Do not use filenames or array
  positions as authoritative identity.
- Keep document metadata, page order, edit state, OCR state, and file references
  consistent through an atomic or recoverable workflow.
- Prefer additive, versioned schema migrations. Never destructively rewrite the
  local library without explicit approval, a backup/recovery path, and tests.
- Reconcile the metadata index with the filesystem after crashes and interrupted
  imports or exports.
- Deletion must cover source images, derivatives, thumbnails, OCR indexes, PDFs,
  and temporary files, while respecting any explicit recovery/trash behavior.
- Detect insufficient storage before starting large processing or export work
  where the platform permits it.

## Engineering conventions

- Use TypeScript and keep camera, processing, OCR, PDF, storage, and UI concerns
  behind explicit interfaces.
- Keep domain models and coordinate transforms framework-independent and testable.
- Wrap platform OCR, camera, and filesystem APIs in adapters rather than calling
  them throughout screens and components.
- Represent long-running operations with explicit idle, queued, running, success,
  cancelled, and failure states.
- Use cancellable work and ignore stale async results after a document, page, or
  screen changes.
- Do not block the JavaScript/UI thread with full-resolution image processing,
  OCR, PDF encoding, or filesystem traversal.
- Reuse existing services and models instead of duplicating capture, transform,
  persistence, or export logic in screens.
- Record dependency licensing and offline/runtime behavior before adopting native
  OCR, PDF, imaging, or camera libraries.

## Android and iOS parity

PDF Scanner Pro is one product across Android and iOS. Every user-facing feature,
bug fix, permission flow, validation rule, and export behavior must be evaluated
for both platforms before it is called complete.

1. Design shared models, state transitions, validation, and service interfaces
   first. Keep native differences inside platform adapters.
2. When platform-specific behavior is necessary, preserve equivalent outcomes,
   errors, loading/cancellation states, accessibility, privacy, and recovery.
3. Check `.native`, `.ios`, and `.android` variants whenever changing capture,
   image processing, OCR, filesystem access, sharing, biometrics, or permissions.
4. Platform limitations must degrade clearly and safely; never silently skip a
   privacy, persistence, or data-integrity requirement.
5. A handoff must state Android and iOS coverage, what was tested, and any
   deliberately unsupported path.

## Test-driven development

Use red-green-refactor for every behavior change:

1. **Red:** Write or update the smallest focused automated test that expresses
   the requested behavior and demonstrate that it fails for the expected reason.
2. **Green:** Implement only the code needed to make that test pass.
3. **Refactor:** Improve naming, duplication, types, and structure while keeping
   focused and relevant regression tests green.

If a test cannot reasonably be written first, such as a documentation-only
change or device-only camera behavior, state why and perform the closest useful
automated validation plus a documented manual check.

### Required test layers

- Unit tests: coordinate transforms, page ordering, state transitions, filename
  sanitization, search normalization, and quality/size calculations.
- Integration tests: capture-session persistence, filesystem/index consistency,
  OCR result mapping, PDF text-layer placement, export recovery, and migrations.
- UI tests: permissions, manual and automatic capture, multi-page editing,
  interrupted-session recovery, search, deletion, and sharing.
- Device tests: camera lifecycle, orientation, memory pressure, backgrounding,
  low storage, offline operation, and representative low/mid/high-end hardware.
- Fixture tests: a versioned, privacy-safe document corpus with expected crop,
  orientation, OCR, reading-order, and searchable-PDF outcomes.

Add a regression test for every fixed bug. Test names should describe observable
behavior rather than implementation details.

## Performance and reliability

- Measure camera startup, preview frame rate, capture latency, page processing,
  OCR latency, export duration, peak memory, output size, and crash-free sessions.
- Establish budgets from `REQUIREMENTS.md` and test representative mid-range
  devices; a desktop simulator is not performance evidence.
- Bound concurrency during batch OCR and PDF generation to avoid memory pressure.
- Maintain deterministic job state so interrupted work can retry idempotently.
- Prefer progressive thumbnails and status updates over an apparently frozen UI.
- Treat a release as incomplete until it can be built, observed, rolled back, and
  recovered without placing user documents at risk.

## Agent code-review protocol

Reviews are evidence-based. Inspect the diff, affected call paths, tests, native
configuration, permissions, storage behavior, and both platform variants.

Report findings first, ordered by severity, with file and line references,
impact, reproduction or reasoning, and a concrete recommended fix.

Review through these lenses:

- **Correctness:** coordinate spaces, orientation, page order, async races,
  cancellation, error states, retries, and backward compatibility.
- **Privacy and security:** permissions, unintended uploads, logs, temporary
  files, exports, untrusted imports, secrets, and deletion completeness.
- **Document integrity:** source preservation, reversible edits, OCR alignment,
  PDF validity, redaction, and interrupted-operation recovery.
- **Platform parity:** Android/iOS adapters, native configuration, permissions,
  sharing, backgrounding, accessibility, and fallback behavior.
- **Performance:** UI-thread work, bitmap memory, job concurrency, large scans,
  storage use, and resource cleanup.
- **Maintainability:** boundaries, type safety, duplication, dependency licensing,
  test quality, and unnecessary complexity.

| Severity | Meaning | Merge expectation |
| --- | --- | --- |
| Blocker | Document loss, privacy exposure, unsafe redaction, unauthorized upload, corrupted export, or irreversible migration risk. | Fix and retest before merge or release. |
| High | Material correctness, cross-platform, reliability, accessibility, or performance defect likely to affect users. | Fix before merge unless an owner explicitly accepts and documents the risk. |
| Medium | Important resilience, validation, testing, or maintainability gap. | Fix in the change when practical or track with an owner and target release. |
| Low | Minor clarity, consistency, or non-blocking quality issue. | Address opportunistically without obscuring higher-severity findings. |

For review-only requests, do not edit files or external state unless remediation
is also requested. For review-and-fix requests, add failing tests first, fix in
priority order, and re-review the final diff.

## Validation before handoff

Run checks proportionate to the change. At minimum for code changes once project
scripts exist:

```bash
git diff --check
npm run typecheck
npm test -- --runInBand
```

Run focused tests while iterating. For camera, native-module, permission, OCR,
filesystem, or PDF changes, also build and exercise the affected flow on a real
Android or iOS device. Simulator success alone is not evidence that camera and
resource-lifecycle behavior works on a phone.

Every handoff must state:

- checks and device flows run;
- Android and iOS coverage;
- privacy-sensitive data paths reviewed;
- remaining risks or unverified behavior; and
- any required manual setup or migration.

## Documentation integrity

- Update requirements and operational documentation in the same change as the
  behavior, data model, permission, security, build, or release procedure.
- Do not retain obsolete instructions that misrepresent supported OCR languages,
  offline behavior, privacy, export formats, or platform coverage.
- For every manual dependency such as store configuration, signing, native
  permissions, model downloads, or release setup, document the owner, exact
  prerequisite, verification, and rollback or recovery step.

## Git hygiene

- Preserve unrelated working-tree changes and stage only files for the current
  task.
- Do not rewrite history, force-push, hard reset, or delete user data without
  explicit approval.
- Keep commits focused and describe user-visible or operational impact.
- Never commit generated scans, OCR fixture documents containing personal data,
  build output, local credentials, or signing material.
