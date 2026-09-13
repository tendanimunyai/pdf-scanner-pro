# Google Play discovery and analytics

## Purpose

This document defines the product name, Google Play store listing, discovery
strategy, creative assets, localization, experimentation, and privacy-safe
measurement plan for PDF Scanner Pro.

Google Play currently limits app names to 30 characters, short descriptions to
80 characters, and full descriptions to 4,000 characters. Reconfirm these limits
and the metadata policy in Play Console before every release that changes the
listing.

Official references:

- [Create and set up an app](https://support.google.com/googleplay/android-developer/answer/9859152)
- [Store listing best practices](https://support.google.com/googleplay/android-developer/answer/13393723)

## Recommended name

- In-app brand: **PDF Scanner Pro**
- English Google Play title: **PDF Scanner Pro: OCR Camera**
- Title length: 27 characters
- Repository name: `pdf-scanner-pro`
- Suggested package pattern: `com.<company>.pdfscannerpro`

The store title preserves the brand and naturally contains three relevant search
concepts: PDF scanner, OCR, and camera. Do not add claims such as “Best,” “#1,”
“Free,” or “No Ads” to the title.

The title recommendation is not legal clearance. Before public release, complete
Google Play, Apple App Store, company-register, domain, social-handle, and formal
trademark searches in every intended market. Record the decision and approver.
Choose the Android application ID before publishing; do not assume it can be
changed after release.

## Short description

Primary recommendation:

> Scan documents and receipts to searchable PDFs with private, offline OCR.

Alternative for a store-listing experiment:

> Fast document scanning, accurate OCR and searchable PDFs—all on your phone.

The short description must remain accurate for the released build. Do not claim
offline OCR, languages, encryption, or unlimited usage until those behaviors are
implemented and verified.

## Full-description opening

Use this as the baseline first paragraph:

> Scan documents, receipts, invoices, notes and contracts into clear, searchable
> PDF files. PDF Scanner Pro automatically detects page edges, corrects
> perspective, improves readability and extracts text with private, on-device
> OCR. No account is required, and your documents remain on your phone unless you
> choose to share them.

Structure the remainder around outcomes rather than a repetitive keyword list:

1. Scan documents to PDF.
2. Extract text with offline OCR.
3. Create selectable, searchable PDFs.
4. Capture receipts and invoices in batches.
5. Automatically crop, straighten, and enhance pages.
6. Review uncertain OCR results.
7. Organize and search local documents.
8. Export without a watermark.
9. Protect documents locally.

Do not repeat phrases unnaturally, refer misleadingly to competitors, or add
unsupported store-ranking, pricing, or promotional claims.

## Search themes

Use these terms naturally in accurate sentences, headings, localized copy, and
creative captions. They are themes, not a block to paste into the listing.

### Primary

- PDF scanner
- document scanner
- scan to PDF
- OCR scanner
- camera scanner

### Secondary

- receipt scanner
- invoice scanner
- image to text
- searchable PDF
- offline OCR
- photo to PDF
- document camera
- scan documents

### Initial regional opportunities

- receipt scanner for small business
- invoice scanner for small business
- Afrikaans OCR
- expense document scanner

Only target a language-specific OCR term after accuracy has passed the corpus and
device acceptance criteria for that language.

## Creative assets

### Icon

- Use a simple white document silhouette with four visible corner-detection marks.
- Use a distinctive teal or electric-blue field with sufficient contrast.
- Keep the silhouette recognizable at the smallest Play Store display size.
- Do not put words, tiny OCR lettering, a detailed camera, or promotional badges
  in the icon.
- Avoid visual similarity to Adobe branding and generic scanner icons.

### Screenshot sequence

1. **Scan documents in seconds** — live edge detection around a real page.
2. **Create clear searchable PDFs** — enhanced page and selectable text.
3. **Private, offline OCR** — visible on-device processing state.
4. **Catch blur and glare before saving** — quality feedback and retake reason.
5. **Scan multiple pages hands-free** — continuous batch capture.
6. **Review uncertain OCR words** — image-to-text comparison and correction.
7. **Organize receipts and invoices** — folders, fields, and local search.
8. **Export or share anywhere** — native destination selection.

Each screenshot should communicate one verified benefit with minimal text. Use
real application UI, representative synthetic documents, accessible contrast,
and a device frame only when it improves comprehension. Never expose personal or
customer information in store assets.

Create localized screenshot text and listing metadata for each supported market;
do not rely solely on automatic translation. Start with English. Add Afrikaans
when both the interface and advertised OCR behavior are validated.

### Video

Create a short demonstration that reaches a searchable PDF within 20 seconds:

1. Open capture.
2. Detect and capture a page.
3. Show quality confirmation and enhancement.
4. Show recognized/selectable text.
5. Export the searchable PDF.

The video must show actual behavior from a release-equivalent build and must not
use ranking, exaggerated performance, or unsupported privacy claims.

## Google Analytics measurement plan

Google Analytics must be configured for Android and iOS from the first runnable
application scaffold. Use a typed, provider-independent analytics service so the
application can enforce consent and field allowlists centrally.

### Required funnel events

| Event | Trigger | Allowed parameters |
| --- | --- | --- |
| `first_open` | First eligible launch after consent resolution | app version, platform, locale |
| `camera_permission_result` | Permission prompt resolves | granted/denied/restricted, platform |
| `scan_started` | User opens a new capture session | entry point, platform |
| `page_capture_completed` | A page is retained | capture mode, quality band, duration band |
| `page_quality_result` | Quality analysis completes | quality band, allowlisted reason codes |
| `ocr_completed` | Page OCR finishes | success/failure, language code, duration band, confidence band |
| `export_started` | User confirms export | format, quality option, page-count band |
| `export_completed` | Export finishes | success/failure/cancelled, duration band, allowlisted failure code |
| `first_successful_export` | Installation completes its first export | format, page-count band, days-since-install band |

Never attach document text, extracted values, filenames, document titles, paths,
images, PDFs, contact information, exact storage sizes, or raw exception messages
to these events.

### Primary metrics

- Store listing visitor-to-install conversion.
- First-open-to-scan-start rate.
- Camera permission grant rate.
- Scan-start-to-first-page retention rate.
- First-page-to-successful-export conversion.
- Time to first successful export.
- Retake rate by allowlisted quality reason.
- OCR and export success rates and latency bands.
- Crash-free and ANR-free sessions.
- Day 1, Day 7, and Day 30 return rates.
- Uninstall rate where aggregate Play Console data is available.

Analytics measures product behavior; the local benchmark suite remains the source
of truth for image quality, OCR accuracy, PDF alignment, and data-deletion claims.

### Privacy and governance

- Use separate development and production Analytics configuration and streams.
- Confirm debug events in development before considering instrumentation complete.
- Do not ship debug analytics configuration in production.
- Obtain and persist consent where required; collection must respect withdrawal.
- The core product must work fully when analytics collection is disabled.
- Configure retention to the shortest period justified by the metric purpose.
- Restrict access to named product and engineering roles and review it regularly.
- Keep the event catalog, privacy policy, consent UI, Play Data safety form, and
  observed SDK traffic consistent.
- Review third-party SDK additions for transitive data collection before release.

## Store optimization process

1. Establish an accurate baseline listing and instrument the funnel.
2. Release to internal and closed testing and resolve crashes, ANRs, camera startup
   failures, and export failures before spending on acquisition.
3. Ask for a rating only after a successful export; respect dismissal and do not
   interrupt capture or recovery flows.
4. Respond to early reviews and classify recurring complaints by feature, device,
   locale, and release without copying personal information into internal tools.
5. Run one controlled Play Store listing experiment at a time, starting with the
   icon, short description, or first screenshot.
6. Predefine the primary metric, minimum sample, duration, and decision rule. Do
   not stop an experiment only because an early result looks favorable.
7. Retain the winning truthful variant, record the result, and update this document.
8. Re-test localized listings independently because search intent and creative
   performance differ by market.

Store discovery is not only metadata. Protect Android vitals, startup time,
download size, onboarding completion, successful exports, retention, and review
quality; acquisition that leads to failed scans or poor PDFs will not produce
durable growth.
