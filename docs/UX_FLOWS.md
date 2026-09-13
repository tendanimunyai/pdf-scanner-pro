# UX flows and states

## Principles

- Reach capture quickly without requesting unrelated permissions.
- Never hide destructive, privacy, quality, OCR, or export uncertainty.
- Every long-running action is cancellable or safely resumable.
- Automatic decisions are reviewable; manual capture/crop remains available.
- Screen-reader order, dynamic type, touch targets, and non-color status are part
  of every acceptance review.

## First scan

```text
Welcome -> Start scan -> Camera education -> Permission
  granted -> Camera -> Capture -> Page review -> OCR -> Export -> Library
  denied  -> Explanation -> Import photo/file or Open Settings
```

Do not require an account, rating, subscription, or Analytics consent to complete
the core workflow. Resolve Analytics consent in a context that explains the choice
without blocking capture.

## Capture states

Camera unavailable, looking for document, document found, hold steady, capturing,
processing, captured, and recoverable error. Automatic capture can be disabled at
all times. Quality feedback states the reason and offers Retake or Keep anyway.

## Manual crop

Show the source image, magnified corner handles, detected boundary, reset, rotate,
cancel, and apply. Cancel preserves the previous accepted crop. Invalid/self-
intersecting corners cannot be applied and receive an accessible explanation.

## Multi-page review

Show stable thumbnails and page count. Users can add, reorder, select, rotate,
recrop, filter, duplicate, split, and delete. Multi-delete requires confirmation;
undo remains available until destructive cleanup commits.

## OCR review

Display page image and recognized text with uncertain content emphasized without
color alone. Selecting a word reveals its image region, confidence band when
available, and editable value. Corrections update search/export data, never image
pixels. Failed pages offer retry or image-only export.

## Export

Name -> format/page size/quality -> estimated size -> Export. States are queued,
running with progress, cancelling, completed, and failed with retry. Save/share is
offered only after output validation. Cancellation retains the scan.

## Recovery

On launch, detect an interrupted scan or job and offer Resume or Discard with an
explanation of what exists. Resume is default-safe. Discard uses the complete,
idempotent deletion workflow.

## Library and deletion

Library supports search, folders/tags, sort, rename, duplicate, share, and delete.
Permanent deletion lists internal content removed and explains that previously
shared or externally saved copies cannot be deleted by the app.

## Privacy and app lock

Privacy settings show local-only state, Analytics consent, retention behavior,
diagnostics, and permanent deletion. App lock setup explains key-loss/recovery
behavior before activation. Hide sensitive previews in the app switcher where the
approved platform implementation permits it.

## Rating request

Request a rating only after a successful export, never during capture, recovery,
permission denial, OCR review, or error handling. Respect dismissal and platform
frequency controls.
