# MVP implementation status

## Verified in the repository

- Expo 57 TypeScript foundation with Android and iOS prebuild configuration.
- App-private source-page storage and SQLite metadata/search schema.
- Bounded image imports (type, byte size, and dimensions) with cleanup on failed batches. PDF import validation remains implemented as a service contract, but the incompatible Expo document-picker native module is excluded from the runnable MVP build until an SDK-57-compatible picker is available.
- Recoverable multi-page capture, title editing, local search, and confirmed deletion.
- Versioned job records with startup requeue for interrupted work.
- Typed privacy-safe analytics with opt-in local SQLite diagnostics.
- Funnel event emission is wired through the allowlisted analytics wrapper; the default provider remains disabled.
- Coordinate transforms, quality scoring, OCR review policy, import validation, and atomic-file utilities.
- Versioned, normalized reversible page-edit state for crop, rotation, and filter parameters.
- Configurable filename suggestions use only confirmed OCR fields and platform-safe sanitization.
- Document duplication cleans copied derivatives if metadata persistence fails mid-transaction.
- Export preflight checks estimated output size against free space with storage headroom.
- Bounded sampled-pixel checks flag likely blank pages and probable duplicates before bulk removal.
- Scan processing accepts abort signals and prevents cancelled jobs from committing late results.
- Page reordering is persisted atomically with temporary positions, avoiding unique-key collisions.
- Library UI exposes Recent, Created, and Title sorting while keeping OCR/title search available.
- Explicit Share actions use the native platform share sheet for persisted local PDFs.
- Review completion now creates an image-preserving local PDF from captured pages; OCR text is added when the native OCR service is available.
- Library documents can be duplicated into independently owned private files with rollback cleanup.
- Duplication preserves imported PDF and thumbnail artifacts instead of silently dropping them.
- Consent withdrawal disables collection and clears locally retained diagnostics through the provider boundary.
- Local diagnostics expose bounded retention purging (1–365 days) in addition to full deletion.
- Review completion awaits document-title persistence and reports failures without discarding the page.
- Startup recovery reports the number of interrupted jobs safely requeued for resumption.
- Searchable PDF encoder and typed native OCR/imaging bridge adapters with explicit unavailable-model fallbacks.
- Export workflow supports an explicit image-only fallback when OCR fails, preserving recoverable scans.
- Plain-text export preserves stored OCR page order and writes atomically.
- Database initialization failures now render an actionable, non-destructive recovery state.
- Automated checks: typecheck, lint, formatting, diff check, and unit tests.
- Android release APK compilation passes; the packaged merged manifest contains camera but no microphone permission. A clean emulator launch still reports a stale `expo-document-picker` registration despite the dependency being removed, so release smoke verification remains open.

## Required before MVP release

- Install and approve the native imaging module for corner detection, perspective correction, filters, and quality metrics.
- Install and approve bundled Apple Vision and Android ML Kit OCR adapters.
- Select and integrate a PDF engine that embeds page images and aligned invisible OCR text, then validate representative viewers.
- Exercise image import, camera lifecycle, OCR, export, deletion, and recovery on physical Android and iOS devices.
- Install full Xcode (not Command Line Tools) before running the iOS native build; the current environment cannot run `xcodebuild`.
- Run the versioned document corpus and 50-page stress gate; record evidence in `TECHNICAL_SPIKES.md`.

The app must not advertise searchable PDF, offline OCR, automatic correction, or guaranteed performance until these platform gates have passed.
