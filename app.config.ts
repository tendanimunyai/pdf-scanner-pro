import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'PDF Scanner Pro',
  slug: 'pdf-scanner-pro',
  version: '0.1.0',
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pdfscannerpro.app',
    infoPlist: {
      NSCameraUsageDescription: 'Capture paper documents when you start a scan.',
      NSPhotoLibraryUsageDescription: 'Choose document pages when you import a scan.',
    },
  },
  android: {
    package: 'com.pdfscannerpro.app',
    permissions: ['android.permission.CAMERA'],
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    'expo-dev-client',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow PDF Scanner Pro to capture a document when you start a scan.',
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    ['expo-sqlite', { enableFTS: true, useSQLCipher: true }],
  ],
  experiments: { typedRoutes: false },
});
