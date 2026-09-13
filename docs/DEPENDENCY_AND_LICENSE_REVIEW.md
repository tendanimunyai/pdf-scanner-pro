# Dependency and license review

## Approval rule

No camera, imaging, OCR, PDF, database, encryption, biometric, diagnostics, or file
processing dependency enters the production architecture until this record covers
its version, source, license, obligations, maintenance, security, platform support,
offline behavior, binary size, performance, data collection, and replacement path.

## Provisional candidates

| Area            | Candidate                          | Status             | Required evidence                                                   |
| --------------- | ---------------------------------- | ------------------ | ------------------------------------------------------------------- |
| Framework       | React Native with current Expo SDK | Provisional        | Supported Node/OS matrix, upgrade policy, build proof               |
| Camera          | `expo-camera`                      | Spike required     | Frames, focus, flash, orientation, burst, lifecycle, performance    |
| Native bridge   | Local Expo modules/config plugins  | Provisional        | Reproducible Android/iOS generation and tests                       |
| Imaging         | OpenCV native distribution         | Spike/legal review | License notices, binary size, ABI, memory, filters, maintenance     |
| Android OCR     | Bundled ML Kit Text Recognition v2 | Provisional        | Offline first run, scripts, size, terms, geometry, accuracy         |
| iOS OCR         | Apple Vision                       | Provisional        | Supported languages/OS, geometry, accuracy, offline behavior        |
| PDF             | Undecided; compare at least two    | Blocked on spike   | Unicode text layer, licensing, fonts, memory, cancellation, viewers |
| Metadata        | SQLite adapter                     | Spike required     | migrations, FTS, transactions, encryption compatibility             |
| Files           | Expo/native filesystem adapter     | Spike required     | atomic move, backup flags, protection class, large files            |
| Keys/biometrics | Platform keystore/keychain adapter | Spike required     | key loss, enrollment change, fallback, threat model                 |
| Diagnostics     | Local allowlisted SQLite records   | Provisional        | opt-in, retention, deletion, export preview, payload inspection     |

## Foundation review record — 2026-09-13

- Dependencies: Expo 57.0.22, expo-sqlite 57.0.3, expo-secure-store 57.0.4,
  expo-crypto 57.0.3.
- Source: official Expo SDK 57 packages from npm.
- Owner: mobile engineering owner (assignment required before Phase 1 exit).
- License: dependency license inventory and distributed notices remain required.
- Platforms: Android and iOS development builds; Expo Go is not release evidence.
- Offline behavior: SQLite, SQLCipher, SecureStore, and random-key creation are
  local native operations and require no runtime download.
- Data collection: none declared by these storage/key packages; release network
  inspection remains required.
- Decision: provisional for the Phase 1 foundation, pending S5 physical-device,
  backup, lost-key, reinstall, migration, and deletion evidence.
- Security note: npm reports moderate advisories in Expo CLI/config transitive
  packages. The proposed automated fix downgrades Expo to 46 and is rejected.
  Revisit on each Expo 57 patch and before external distribution.

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
