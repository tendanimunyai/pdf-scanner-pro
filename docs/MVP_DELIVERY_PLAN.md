# MVP delivery plan

## Delivery principle

Build the smallest end-to-end path first: capture one page, correct it, recognize
text, create a searchable PDF, close the app, reopen it, and confirm recovery.
Features advance only after their exit criteria pass on a physical Android device
and a physical iPhone.

## Phase 0 — technical proof

Deliver disposable or isolated spikes for camera frames, OpenCV, OCR, searchable
PDFs, storage/encryption, 50-page memory, and local diagnostics privacy.

Exit criteria:

- The five critical spikes in `TECHNICAL_SPIKES.md` pass.
- Camera, OCR, PDF, and encryption dependencies receive provisional approval.
- A real one-page scan produces selectable, correctly aligned text offline.
- No architectural blocker remains without an owner and decision date.

## Phase 1 — application foundation

- Scaffold the Expo development-build project and native targets.
- Add navigation, theme, error boundaries, typed service interfaces, SQLite schema,
  file layout, persisted job model, and local diagnostics adapter.
- Configure local diagnostics disabled by default with allowlisted event payloads.
- Establish CI for formatting, linting, type checking, unit tests, secrets, and
  dependency review.

Exit criteria: clean install and deterministic build on Android and iOS; tests and
local diagnostics and no-analytics-network verification pass; no production credentials exist locally.

## Phase 2 — one-page scanner

- Permission education and camera capture.
- Manual capture, crop, perspective correction, rotation, and filters.
- Quality feedback for blur, glare, missing corners, and resolution.
- Source preservation and interrupted-session recovery.

Exit criteria: a new user produces a readable corrected page; denial and camera
interruption recover safely; source and edits survive restart.

## Phase 3 — OCR and searchable PDF

- Bundled offline OCR, orientation handling, bounding geometry, and retry.
- OCR review for failed and low-confidence content.
- Searchable PDF generation, validation, local save, and native share.
- Plain-text export and estimated output size.

Exit criteria: corpus accuracy target passes for clean English; PDF text alignment
passes after every supported transform; representative viewers open the output.

## Phase 4 — multi-page library

- Continuous multi-page capture, thumbnails, reorder, recrop, rotate, and delete.
- Local encrypted library, search, rename, folders, tags, and complete deletion.
- Bounded OCR/export queues and crash reconciliation.

Exit criteria: 20 pages meet MVP usability criteria and 50 pages pass the stress
gate on the reference mid-range device without data loss or memory failure.

## Phase 5 — small-business differentiation

- Reviewable invoice/receipt field extraction.
- Naming templates, duplicate/blank-page detection, split/combine, and saved
  export workflows.
- Optional biometric lock.

Exit criteria: target users complete the defined receipt and invoice workflows
faster than the baseline manual flow, with no unconfirmed extraction treated as
authoritative.

## Phase 6 — beta and launch

- Accessibility, localization, store assets, privacy policy, Data safety form,
  local diagnostics validation, dependency/license record, and incident/release runbook.
- Internal, closed, then staged production release.

Exit criteria: acceptance suite passes; crash/ANR thresholds are met; rollback is
tested; store claims exactly match the build.

## MVP exclusions

Cloud sync, collaboration, handwriting guarantees, signatures, redaction, Office
exports, server OCR, and legal certification do not block the first release.

## Change control

Every added MVP feature must identify the user problem, phase, acceptance test,
privacy effect, Android/iOS impact, schedule tradeoff, and feature being displaced.
