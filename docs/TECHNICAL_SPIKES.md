# Technical spikes

## Rules

Spikes are time-boxed, isolated, and evidence-producing. Record device, OS, build,
dependency version, input fixture, measured results, limitations, license, and the
decision. Do not merge disposable spike code into production modules unchanged.

## S1 — camera and frame access

Prove preview startup, permission recovery, focus/exposure, flash, orientation,
manual capture, analysis frames, throttling, and cancellation using `expo-camera`.

Pass: preview within required budget; stable frame analysis on both platforms;
full-resolution capture preserves orientation; background/foreground cycles do not
leak, freeze, or duplicate sessions.

## S2 — document detection and enhancement

Build a local Expo imaging module that detects corners, scores blur/glare, applies
perspective correction, and produces color, grayscale, and monochrome derivatives.

Pass: benchmark corner and quality targets are defined and met on the starter
corpus; manual corner coordinates round-trip correctly; peak memory is recorded;
originals remain unchanged.

## S3 — on-device OCR

Use Apple Vision and bundled Android ML Kit on final processed pages. Capture text,
blocks, lines, words where available, confidence, orientation, and geometry.

Pass: first-run airplane-mode recognition works; clean-English accuracy reaches
the MVP target; results survive rotation; unsupported languages and failures are
explicit; Android package-size impact is accepted.

## S4 — searchable PDF

Evaluate at least two technically and legally viable PDF engines. Generate PDFs
with image pages and aligned invisible Unicode text after crop, perspective,
rotation, and A4/Letter/original scaling.

Pass: search/select/copy and reading order work in representative Android, iOS,
browser, macOS, and Windows viewers; cancellation leaves no partial success;
10-page timing and memory meet requirements; license and font obligations pass.

## S5 — persistence and encryption

Prototype the filesystem layout, SQLite schema, atomic promotion, reconciliation,
key storage, biometric unlock, deletion, and recovery after forced termination.

Pass: no source loss across injected failures; database/files reconcile; protected
data is not readable as plaintext at rest within the documented threat boundary;
lost-key and reinstall behavior is specified.

## S6 — 50-page stress

Capture or import 50 representative pages, create thumbnails, process, OCR, reorder,
restart mid-job, resume, and export on the reference mid-range Android and iOS
devices.

Pass: no out-of-memory termination or page duplication/loss; UI remains responsive;
peak memory, storage, total time, thermal behavior, and battery impact are recorded.

## S7 — Analytics and consent

Configure separate development Analytics, default-disabled collection where needed,
consent transitions, withdrawal, typed event allowlisting, and debug verification.

Pass: events appear only after eligible enablement; withdrawal stops collection;
payload inspection shows no prohibited fields; core workflow remains unchanged
when Analytics is unavailable.

## Decision record

Create one entry per spike containing date, owner, status, evidence path, result,
selected option, rejected alternatives, risks, and revisit trigger.
