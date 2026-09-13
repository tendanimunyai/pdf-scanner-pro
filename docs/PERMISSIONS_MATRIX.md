# Permissions matrix

Request permission at the moment a user invokes the feature, not at application
startup. Core library browsing and photo import must remain available when camera
access is denied, subject to the relevant picker behavior.

| Capability | Android | iOS | Trigger | Denied behavior |
| --- | --- | --- | --- | --- |
| Camera | Camera runtime permission | Camera usage description | Start camera capture | Explain; offer photo/file import and Settings recovery |
| Photo import | System photo picker; avoid broad media access | PHPicker; avoid broad library access | Import photos | Explain; retain camera and file options |
| File import | System document picker | Document picker | Import PDF/image | Return safely with no partial document |
| File export | Storage Access Framework/system share | Document picker/share sheet | Save/share completed output | Keep internal completed PDF and retry |
| Biometrics | Biometric capability and platform prompt | Face ID usage description when required | Enable/unlock app lock | Fall back to documented device credential or recovery policy |
| Notifications | Runtime permission on applicable Android | Notification authorization | User enables export/job notifications | Continue in-app progress without notifications |
| Analytics | No OS permission; consent/policy controls apply | No tracking permission when no tracking occurs; consent still applies | Consent resolution | Keep collection disabled; app remains functional |

Do not request microphone, contacts, location, phone, SMS, broad storage, advertising
ID, or accessibility-service permissions for the MVP.

Before release, verify exact manifest/plist entries against the selected Expo SDK,
target SDK, native dependencies, and current store policies. Remove transitive
permissions not required by a user-visible capability.

Test first request, denial, repeated denial, restricted state, “don’t ask again,”
Settings enable/disable, OS upgrade, app upgrade, background interruption, and
revocation while the app is running on Android and iOS.
