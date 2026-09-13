# PDF Scanner Pro Requirements

## 1. Product goal

Build a privacy-focused mobile application that lets a user capture one or more
paper documents with a phone camera, correct and enhance the images, recognize
their text with OCR, and export a searchable PDF.

The first release should support Android and iOS and should work without an
account. Core scanning and OCR must remain usable offline.

### 1.1 Competitive position

PDF Scanner Pro should be positioned as the fastest, most private scanner for
producing verifiably accurate, searchable documents without requiring an account
or cloud storage. It must compete on capture quality, OCR trust, recovery, and
workflow efficiency rather than on a feature checklist alone.

The initial target segment is small businesses that repeatedly capture invoices,
receipts, quotes, delivery notes, and expense records. General-purpose scanning
must remain excellent, but naming, extraction, organization, and export decisions
should first optimize this segment.

## 2. MVP user journey

1. The user opens the app and starts a new scan.
2. The app requests camera permission when it is first needed.
3. The camera preview detects a document and displays its boundaries.
4. The user captures a page manually or with automatic capture.
5. The app crops the page, corrects perspective, and enhances readability.
6. The user reviews, rotates, recrops, filters, reorders, adds, or deletes pages.
7. OCR extracts text from every page.
8. The user names the document and exports or shares a searchable PDF.
9. The document remains available in the local document library.

## 3. Functional requirements

### 3.1 Camera capture

- Use the rear camera by default and support flash modes: off, on, and auto.
- Show a live preview with a document-edge overlay.
- Support manual capture and stable-document automatic capture.
- Provide focus, exposure, blur, glare, and low-light feedback where supported.
- Evaluate blur, motion, glare, shadows, missing corners, finger obstruction,
  text resolution, and document stability before automatic capture.
- When hardware and memory permit, select the sharpest usable image from a short
  frame burst instead of accepting the first eligible frame.
- Assign every captured page an understandable quality result: Excellent,
  Usable, or Retake recommended, including the reason for the result.
- Support multi-page scanning without leaving the capture flow.
- Import images from the device photo library as an alternative to camera capture.
- Preserve a high-resolution source image until export succeeds.

### 3.2 Image processing

- Detect the four document corners and remove the surrounding background.
- Correct perspective so the output page is rectangular.
- Allow manual corner adjustment when automatic detection is inaccurate.
- Support rotation in 90-degree increments.
- Provide original, color, grayscale, and black-and-white filters.
- Improve contrast and remove shadows without making text unreadable.
- Detect potentially blurred pages and prompt the user to retake them.
- Detect blank and likely duplicate pages and ask the user before removing them.
- Detect fingers, stains, and small unwanted objects and offer a non-destructive
  cleanup tool.
- Allow users to compare the original and enhanced page at full resolution.
- Retain reversible edit parameters so changing a filter does not repeatedly
  recompress or permanently alter the source image.

### 3.3 Page management

- Display captured pages as reorderable thumbnails.
- Allow pages to be added, duplicated, rotated, recropped, or deleted.
- Confirm destructive actions when deleting a document or multiple pages.
- Restore an interrupted scan after an app restart or operating-system eviction.
- Support a continuous hands-free mode for scanning document stacks.
- Allow completed documents to be split or combined without rescanning pages.
- Estimate the final PDF size before export and warn when storage is insufficient.

### 3.4 OCR

- Run OCR for every retained page and keep recognized text associated with its
  page and bounding boxes.
- Support English in the MVP, with a design that permits additional language
  packs later.
- Automatically detect page orientation before recognition.
- Produce selectable and searchable text in exported PDFs.
- Allow users to copy all recognized text or share it as plain text.
- Clearly report pages where recognition failed and allow OCR to be retried.
- Preserve confidence values where the platform OCR engine provides them.
- Highlight uncertain words in an optional OCR review screen and let the user
  compare each word with its source-image region.
- Allow corrections to update copied text, the local search index, structured
  fields, and the exported PDF text layer without altering the page image.
- Preserve paragraphs, columns, tables, and reading order where recognition
  quality permits.
- Extract candidate dates, totals, tax amounts, supplier names, document numbers,
  phone numbers, email addresses, and physical addresses into reviewable fields.
- Never treat extracted fields as authoritative until the user confirms them.
- Produce an OCR quality summary showing failed pages and unreviewed low-confidence
  text before export.
- Target at least 95% character accuracy for clean, well-lit, printed English
  documents captured at the recommended distance.
- Handwriting recognition is out of scope for the MVP.

### 3.5 PDF generation and export

- Generate standards-compliant PDF files containing the processed page images
  and an aligned, invisible OCR text layer.
- Support A4, Letter, and original-page sizing.
- Offer low, medium, and high output quality.
- Show an estimated output size for each quality option.
- Allow the document title to be edited before export.
- Share through the native system share sheet and save through the platform file
  picker.
- Show export progress and recover cleanly from cancellation or insufficient
  storage.
- Do not place a watermark on user documents.
- Support plain-text export in the MVP. Design the export layer to add Markdown,
  DOCX, and structured JSON without changing OCR storage.
- Generate the file in a temporary location, validate that it is complete and
  readable, and only then expose it through save or share actions.

### 3.6 Local document library

- Store scans locally by default with thumbnail, title, page count, and modified
  date.
- Support search by title and OCR text.
- Sort by title, created date, or modified date.
- Rename, duplicate, share, and delete documents.
- Suggest editable filenames from confirmed OCR fields using configurable patterns
  such as `Supplier - Document Number - Date`.
- Support folders, tags, and saved searches for frequently used document groups.
- Make cloud backup or synchronization an optional post-MVP capability.

### 3.7 Batch workflows

- Allow at least 50 pages to be captured in one recoverable scan session on a
  supported mid-range device.
- Remove confirmed blank pages and flag probable duplicates in bulk.
- Allow separator pages or user-selected boundaries to split one capture session
  into multiple documents.
- Provide saved export workflows that combine naming, destination, file format,
  quality, and optional post-export cleanup.
- Queue failed exports and allow them to be retried after app restart without
  regenerating successful outputs.
- Keep automatic actions reviewable and reversible until the user completes the
  workflow.

### 3.8 Microsoft Lens migration and productivity exports

- Provide an onboarding path for users moving from Microsoft Lens that explains
  local saving, multi-page capture, OCR, and destination setup.
- Import existing images and PDFs available through the platform file picker;
  preserve page order and original files.
- Support local PDF and JPEG output without a Microsoft or other cloud account.
- Treat OneDrive, SharePoint, OneNote, Word, and PowerPoint integrations as
  post-MVP options implemented through documented, least-privilege APIs or native
  share capabilities.

## 4. Permissions and privacy

- Request camera, photo-library, and file access only when the related feature is
  invoked, using platform-specific explanatory text.
- Keep source images, OCR data, and PDFs on the device by default.
- Encrypt the local document library using platform-protected key material and
  support an optional biometric application lock.
- Provide a local-only mode that disables all document-content network transfers
  and clearly shows when a scan was processed entirely on the device.
- Do not upload document content, use it for advertising, or train models on it.
- If cloud features are added, require explicit opt-in, encrypt data in transit
  and at rest, and provide deletion controls.
- Remove temporary capture and processing files after successful completion or
  cancellation.
- Provide one action to permanently delete a document and its source images,
  derivatives, thumbnails, OCR text, indexes, PDFs, and temporary artifacts.
- Publish and maintain a plain-language data-flow description covering every
  location in which document content can be stored or transferred.
- Avoid logging document images, recognized text, filenames, or other sensitive
  content in diagnostics or crash reports.

## 5. Non-functional requirements

### Performance

- Target a usable camera preview within 1 second and require it within 2 seconds
  on a supported mid-range device.
- Target the first high-quality scan within 3 seconds after opening capture.
- Show an enhancement preview within 500 milliseconds and complete full-resolution
  crop and enhancement within 2 seconds for a typical page.
- Target English OCR within 2 seconds and require it within 5 seconds per typical
  page on a supported mid-range device.
- Target a searchable 10-page high-quality PDF export within 8 seconds and require
  completion within 15 seconds under normal conditions.
- Keep the interface responsive during OCR and PDF generation.
- Capture and process 50 pages without an out-of-memory failure on a supported
  mid-range device.
- Record privacy-safe local performance measurements for camera readiness,
  capture, enhancement, OCR, PDF generation, output size, and peak memory.

### Reliability

- Autosave scan progress after every captured or edited page.
- Never remove source pages until the PDF has been generated and stored
  successfully.
- Handle denied permissions, camera interruption, low memory, full storage, and
  corrupted image input with actionable messages.
- Make batch OCR and export jobs idempotent so a retry does not duplicate pages,
  documents, or output files.

### Accessibility and usability

- Support screen readers, dynamic text, sufficient color contrast, and touch
  targets of at least 44 by 44 points (or Android equivalent).
- Do not communicate capture quality or processing state by color alone.
- Support portrait and landscape capture orientations.

### Compatibility

- Support the two most recent major iOS versions and Android API 26 or newer for
  the MVP, subject to validation against the selected libraries.
- Test representative low-, mid-, and high-range devices and common aspect ratios.

## 6. Recommended implementation baseline

- Mobile framework: React Native with Expo development builds and TypeScript.
- Camera: `expo-camera` or a native camera module if real-time frame processing is
  required.
- Image processing: native OpenCV integration for edge detection, perspective
  correction, and filters.
- OCR: Apple Vision on iOS and Google ML Kit Text Recognition on Android for
  offline, on-device recognition.
- PDF: a native PDF-generation library capable of placing an invisible text layer
  using OCR bounding boxes.
- Storage: app-private filesystem plus a small SQLite index for documents, pages,
  and recognized text.
- State and recovery: persisted scan-session state with background-safe processing
  boundaries.
- Quality analysis: a versioned scoring pipeline with independently testable blur,
  glare, stability, obstruction, corner, and resolution signals.
- Security: platform keystore/keychain-backed encryption keys and biometric access
  through operating-system APIs.

Library choices must be validated for current platform support, licensing,
offline behavior, searchable-PDF output, and compatibility with the chosen Expo
workflow before implementation begins.

## 7. Data model

### Document

- `id`
- `title`
- `createdAt`
- `updatedAt`
- `pageCount`
- `thumbnailPath`
- `pdfPath`
- `ocrStatus`
- `qualitySummary`
- `folderId`
- `tags`

### Page

- `id`
- `documentId`
- `position`
- `sourceImagePath`
- `processedImagePath`
- `corners`
- `rotation`
- `filter`
- `ocrText`
- `ocrBlocks`
- `ocrStatus`
- `ocrConfidence`
- `ocrCorrections`
- `qualityScore`
- `qualityReasons`
- `editParameters`

### Extracted field

- `id`
- `documentId`
- `pageId`
- `type`
- `rawValue`
- `normalizedValue`
- `confidence`
- `boundingBox`
- `confirmationStatus`

## 8. MVP acceptance criteria

- A user can capture and export a one-page document without creating an account.
- A user can capture at least 20 pages in one scan and reorder them before export.
- A supported mid-range device can complete a recoverable 50-page session without
  an out-of-memory crash.
- Automatic edge detection and perspective correction produce a usable page for
  a clearly visible document on a contrasting background.
- Manual cropping remains available when automatic detection fails.
- Exported PDFs open in standard iOS, Android, macOS, and Windows PDF viewers.
- Text from a clean printed page can be searched, selected, and copied from the
  exported PDF.
- OCR text remains aligned after crop, perspective correction, rotation, page
  resizing, and PDF export.
- A user can identify and correct uncertain OCR text before exporting.
- Quality feedback explains whether blur, glare, obstruction, missing corners, or
  low resolution caused a retake recommendation.
- A scan interrupted after capture can be recovered when the app reopens.
- Denying camera access does not crash or block photo-library import.
- Core scanning, OCR, library search, and PDF export work in airplane mode.
- No document content leaves the device during the offline MVP workflow.
- Permanent deletion removes the document and all locally controlled derivatives
  and search records.
- A ten-page representative document meets the required OCR and export timing on
  the defined mid-range reference device.

## 9. Competitive quality benchmark

Maintain a versioned, privacy-safe test corpus containing synthetic or fully
licensed examples of:

- well-lit and low-light pages;
- motion blur, glare, folds, shadows, curved pages, and finger obstruction;
- thermal receipts, invoices, delivery notes, dense contracts, and small print;
- tables, forms, multi-column layouts, stamps, signatures, and colored paper;
- English, Afrikaans, and prioritized South African-language samples;
- mixed-language pages and varied page sizes; and
- captures from representative low-, mid-, and high-range phones.

Track results by application version, device class, language, and document type:

- corner-detection intersection over union and manual correction rate;
- auto-capture acceptance, false-capture, and retake rates;
- OCR character error rate, word error rate, field accuracy, and reading order;
- OCR-to-PDF text-layer alignment;
- camera startup, processing and export duration, and peak memory;
- crash-free completion and interrupted-session recovery rate;
- output size, visual readability, and cross-viewer PDF compatibility; and
- completeness of permanent deletion and temporary-file cleanup.

Release gates and target thresholds must be established from baseline tests
against representative competing products. A feature is not considered a market
advantage until the benchmark shows a measurable improvement in quality, speed,
privacy, recovery, or workflow completion.

## 10. Product and monetization principles

- Basic scanning, manual correction, local PDF saving, and watermark-free export
  must remain usable without a subscription.
- Do not require an account to access locally stored documents.
- Never place documents previously created by the user behind a new paywall.
- Prefer a one-time Pro purchase for advanced local capabilities such as OCR
  review, batch workflows, additional export formats, and enhanced security.
- Reserve recurring subscriptions for services with recurring operating costs,
  such as optional encrypted synchronization, team administration, or managed
  integrations.
- Do not use document content or extracted fields for advertising.

## 11. Post-MVP options

- Additional OCR languages and language auto-detection.
- Password-protected and encrypted PDFs.
- Signatures, annotations, redaction, and form filling.
- Cloud synchronization and cross-device access.
- Batch import, automatic naming, tags, folders, and smart classification.
- Receipt and business-card modes with structured field extraction.
- Direct export to common cloud storage providers.
- Safe redaction that permanently removes both image pixels and corresponding OCR
  text, with export verification.
- Advanced invoice and receipt field extraction with user-defined export schemas.
- Direct OneDrive, SharePoint, OneNote, Word, and PowerPoint workflows.

## 12. Explicitly out of scope for MVP

- Guaranteed handwriting recognition.
- Collaborative document editing.
- Server-side OCR or mandatory cloud storage.
- Legal certification of scans or digital-signature infrastructure.

## 13. Discovery and Google Play listing

The product name, store metadata, screenshots, localization, launch experiments,
and local measurement requirements are defined in `docs/GOOGLE_PLAY_ASO.md`. Treat that
document as the source of truth for Google Play discovery work and update it when
the product positioning, supported languages, or measured store performance
changes.

- Use **PDF Scanner Pro** as the in-app brand and **PDF Scanner Pro: OCR Camera**
  as the recommended English Google Play title, subject to final legal and store
  clearance.
- Optimize discovery around accurate, natural descriptions of PDF scanning,
  document scanning, OCR, searchable PDFs, receipts, invoices, and offline use.
- Never claim functionality, language support, privacy behavior, rankings, or
  performance that the released build and validation evidence do not support.
- Measure the acquisition-to-success funnel locally using privacy-safe events,
  excluding all document content and sensitive metadata. Never transmit these
  events automatically; diagnostic export is an explicit user action.
