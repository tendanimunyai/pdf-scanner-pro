# Test strategy

## Quality model

Use automated tests for deterministic behavior, fixture tests for imaging/OCR/PDF,
and real-device tests for cameras, lifecycle, memory, permissions, and performance.
No single layer is sufficient evidence of release readiness.

## Test layers

- Unit: models, state machines, coordinate transforms, filenames, ordering, search
  normalization, quality bands, size estimates, and error mapping.
- Integration: filesystem/SQLite consistency, job retries, migrations, OCR mapping,
  PDF placement, Analytics allowlists, consent, and deletion.
- UI: onboarding, permissions, capture, manual crop, quality warnings, OCR review,
  multi-page editing, recovery, export, search, and deletion.
- Native/device: focus, flash, orientation, backgrounding, process death, low storage,
  memory pressure, thermal load, offline first run, sharing, and biometrics.
- Store/release: install, upgrade, Data safety consistency, production Analytics,
  deep links if any, app bundle size, crash/ANR health, and staged rollout.

## Corpus

Use synthetic, public-domain, or explicitly licensed documents with no personal or
customer data. Version images and expected results. Cover lighting, blur, glare,
shadows, folds, curves, low contrast, fingers, thermal receipts, small type,
tables, columns, color, rotation, common paper sizes, and supported languages.

Keep a small PR corpus and a larger scheduled/release corpus. Do not commit licensed
fixtures unless redistribution is allowed; store acquisition instructions and
checksums instead.

## Reference devices

Before Phase 0 exits, name one mid-range Android phone and one supported iPhone as
performance gates. Add a low-end Android device for degradation tests and a recent
high-end device for feature compatibility. Record model, RAM, OS, free storage,
battery state, and thermal conditions with results.

## Metrics

- Detection: corner intersection-over-union, manual correction, false capture,
  missed capture, duplicate and blank-page precision/recall.
- OCR: character error rate, word error rate, reading order, supported-language
  accuracy, field precision/recall, and confidence calibration.
- PDF: text overlap/alignment tolerance, reading order, search/select/copy success,
  visual similarity, file size, and viewer compatibility.
- Performance: camera startup, capture, preview/full enhancement, OCR, export,
  peak memory, CPU/thermal behavior, battery, and storage.
- Reliability: crash-free completion, resume success, idempotent retry, no page
  loss/duplication, cleanup, and deletion completeness.
- Accessibility: screen-reader order and labels, dynamic type, contrast, focus,
  non-color status, and minimum touch target.

## Failure injection

Test permission denial, camera loss, backgrounding, process kill at each job stage,
model failure, malformed/huge import, disk full, database error, PDF cancellation,
share cancellation, biometric changes, missing file, duplicate retry, and upgrade
from every supported schema version.

## Release gates

- All MVP acceptance criteria have linked passing evidence.
- No blocker/high privacy, loss, corruption, unsafe-redaction, or permission defect.
- Required timing and 50-page stress pass on reference devices.
- Searchable PDFs pass all representative viewers.
- Analytics payload and consent tests pass on Android and iOS.
- Clean install, upgrade, offline first run, backup behavior, and deletion pass.
- Known failures have owner, user impact, workaround, target version, and explicit
  release acceptance.

## Test reporting

Every handoff records commit, build, environment, devices, commands, fixtures,
results, untested areas, failures, and evidence locations. Separate pre-existing
failures from regressions introduced by the change.
