# Dependency and license review

## Approval rule

No camera, imaging, OCR, PDF, database, encryption, biometric, Analytics, or file
processing dependency enters the production architecture until this record covers
its version, source, license, obligations, maintenance, security, platform support,
offline behavior, binary size, performance, data collection, and replacement path.

## Provisional candidates

| Area | Candidate | Status | Required evidence |
| --- | --- | --- | --- |
| Framework | React Native with current Expo SDK | Provisional | Supported Node/OS matrix, upgrade policy, build proof |
| Camera | `expo-camera` | Spike required | Frames, focus, flash, orientation, burst, lifecycle, performance |
| Native bridge | Local Expo modules/config plugins | Provisional | Reproducible Android/iOS generation and tests |
| Imaging | OpenCV native distribution | Spike/legal review | License notices, binary size, ABI, memory, filters, maintenance |
| Android OCR | Bundled ML Kit Text Recognition v2 | Provisional | Offline first run, scripts, size, terms, geometry, accuracy |
| iOS OCR | Apple Vision | Provisional | Supported languages/OS, geometry, accuracy, offline behavior |
| PDF | Undecided; compare at least two | Blocked on spike | Unicode text layer, licensing, fonts, memory, cancellation, viewers |
| Metadata | SQLite adapter | Spike required | migrations, FTS, transactions, encryption compatibility |
| Files | Expo/native filesystem adapter | Spike required | atomic move, backup flags, protection class, large files |
| Keys/biometrics | Platform keystore/keychain adapter | Spike required | key loss, enrollment change, fallback, threat model |
| Analytics | Firebase Analytics behind wrapper | Required | consent, disabling collection/Ad ID, payload inspection, size |

## Review record template

- Dependency and exact version:
- Official source and release date:
- Owner and review date:
- License and copyright notices:
- Commercial/distribution obligations:
- Native platforms and minimum OS:
- Offline/runtime downloads:
- Data collected or transmitted:
- Binary-size and performance measurement:
- Known vulnerabilities and update process:
- Maintainer activity and bus factor:
- API surface used and wrapper boundary:
- Alternative/replacement strategy:
- Decision: approved, provisional, rejected, or removal required:
- Revisit trigger:

Use official project repositories, vendor documentation, package metadata, and
license text as primary evidence. Automated vulnerability/license scanning assists
review but does not replace it. Preserve required notices in distributed builds.
