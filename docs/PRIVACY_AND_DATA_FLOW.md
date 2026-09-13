# Privacy and data flow

## Default promise

Document content stays on the device unless the user explicitly invokes a share,
save, or future opt-in cloud action. Scanning, processing, OCR, search, and PDF
generation do not require an account or network connection.

## Data inventory

| Data | Location | Purpose | Lifetime |
| --- | --- | --- | --- |
| Source page image | App-private files | Recovery and reversible editing | Until document deletion |
| Processed page | App-private files | Preview, OCR, PDF | Rebuildable; until deletion |
| Thumbnail | App-private cache/files | Library UI | Rebuildable; until deletion |
| OCR text and boxes | Encrypted local database | Search, review, PDF text | Until page deletion |
| Extracted fields | Encrypted local database | Review and naming | Until document deletion |
| Exported PDF | App-private files or user destination | Viewing and sharing | User controlled |
| Temporary files | App-private temporary area | Atomic processing | Job end plus cleanup |
| Analytics events | Google Analytics after eligible consent | Product operations | Configured minimum retention |
| Redacted diagnostics | Local rotating log | Support and reliability | Short documented period |

Files explicitly saved outside app-private storage are controlled by the selected
destination and may outlive deletion inside the app. Explain this before permanent
deletion; never imply the app can recall shared copies.

## Data flow

```text
Camera/photo picker
  -> app-private source image
  -> local imaging module
  -> processed page + quality codes
  -> on-device OCR
  -> encrypted local index
  -> local PDF generator
  -> app-private completed PDF
  -> explicit system save/share action
```

Only allowlisted operational event codes branch to Analytics. No document-derived
content follows that branch.

## Encryption and keys

- Generate encryption keys on device and protect them with platform keystore or
  keychain facilities.
- Never sync raw keys through Analytics, logs, source control, or ordinary app
  preferences.
- Define behavior for device migration, OS backup, biometric enrollment changes,
  lost keys, reinstall, and app-data clearing before enabling encryption by default.
- Biometric authentication unlocks key use; biometric material never enters the app.

## Consent and Analytics

- Core functionality works when Analytics is disabled.
- Resolve the applicable consent state before enabling collection where required.
- Disable advertising identifiers and ad personalization for product Analytics.
- Send only the allowlisted events and parameters in `GOOGLE_PLAY_ASO.md`.
- Provide withdrawal and reset behavior and keep the privacy policy, consent UI,
  SDK settings, and Play Data safety declaration consistent.

## Export boundary

The user must choose an export or share destination. Display the file type and
whether the destination is another app, local filesystem, or cloud provider when
the platform exposes this information. Do not upload through a PDF Scanner Pro
server for MVP.

## Deletion

Permanent deletion removes database records, source images, processed pages,
thumbnails, internal PDFs, job payloads, temporary artifacts, and search-index
entries. It cannot remove copies already exported, shared, backed up by the OS, or
captured in third-party backups. Deletion is idempotent and resumes after crashes.

## Logging and support

Allow only event time, app/build version, platform, coarse device class, stable
error code, job stage, and duration band. Exclude text, images, document IDs that
persist across support sessions, paths, filenames, titles, destinations, contacts,
and raw native exceptions. User-initiated diagnostic export requires preview and
explicit confirmation.

## Threats requiring tests

- Another app or media scanner accesses app-private captures.
- Temporary files remain after cancellation or crash.
- OCR or filenames leak through logs, Analytics, notifications, or backups.
- A malformed import causes resource exhaustion or unsafe native parsing.
- Deletion leaves thumbnails, indexes, exports, or orphaned files.
- Screenshots or app-switcher previews reveal documents; provide sensitive-screen
  protection where platform behavior and usability permit.
- A future cloud or Office integration receives more scope or content than needed.

## Review triggers

Repeat the privacy review for any new SDK, cloud destination, account system,
backup behavior, notification, sharing option, document type, or diagnostic tool.
