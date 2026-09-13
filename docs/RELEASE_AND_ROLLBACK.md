# Release and rollback

## Environments

Use separate development and production signing credentials, application
registrations, and access roles. The app has no Firebase or remote analytics
configuration. Add staging only when it has a defined validation purpose and owner.

Record before the first external build:

- Android application ID and signing owner;
- iOS bundle ID, team, certificates/profiles, and signing owner;
- confirmation that no analytics project IDs, SDKs, or streams are present;
- store accounts, roles, support contacts, and privacy-policy URL;
- minimum/target SDK and supported OS versions; and
- secure recovery procedure for signing access.

## Release sequence

1. Freeze scope and map acceptance criteria to evidence.
2. Build from a clean, committed tree using pinned dependencies.
3. Run automated, corpus, real-device, privacy, permission, upgrade, and deletion
   gates from `TEST_STRATEGY.md`.
4. Verify local diagnostics opt-in, payload allowlists, deletion, Data safety
   declarations, dependency notices, and no automatic diagnostics transmission.
5. Publish to internal testing, then closed testing.
6. Promote the same tested artifact through a staged production rollout.
7. Monitor crash/ANR health, camera failures, scan/export completion, reviews, and
   privacy/security signals during each stage.
8. Halt or expand using predefined thresholds and an identified release owner.

## Rollback

Prefer store rollout halt plus a forward-fix build. A binary rollback does not
reverse local schema changes, so migrations must be backward compatible across the
supported upgrade/downgrade window or guarded by feature/version checks.

Rollback triggers include document loss/corruption, unintended upload or logging,
unsafe deletion/redaction, unusable camera on a material device group, broken
offline OCR/export, crash/ANR threshold breach, or invalid store/privacy disclosure.

For every release record version, commit, artifacts, schema version, flags, rollout
stages, monitors, owner, halt steps, forward-fix steps, user communication, and
post-incident review link.

## Backup and migration safety

Define OS backup inclusion/exclusion for source images, database, keys, thumbnails,
and temporary files before beta. Test clean install, upgrade from every supported
schema, interrupted migration, low storage, lost key, reinstall, and restore. Never
delete the prior representation until the migrated representation validates.
