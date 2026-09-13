import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';
import { useReducer, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { initialCaptureFlow, reduceCaptureFlow } from './src/features/capture/captureFlow';

export default function App() {
  const [flow, dispatch] = useReducer(reduceCaptureFlow, initialCaptureFlow);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  async function continueToCamera() {
    const result = permission?.granted ? permission : await requestPermission();
    dispatch({ type: 'permission_resolved', granted: result.granted });
  }

  async function capturePage() {
    if (!camera.current || isCapturing) return;
    setIsCapturing(true);
    setCaptureError(false);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!FileSystem.documentDirectory) throw new Error('capture_failed');
      const scanDirectory = `${FileSystem.documentDirectory}scans/in-progress/`;
      await FileSystem.makeDirectoryAsync(scanDirectory, { intermediates: true });
      const sourceImagePath = `${scanDirectory}${Crypto.randomUUID()}.jpg`;
      await FileSystem.moveAsync({ from: photo.uri, to: sourceImagePath });
      dispatch({ type: 'captured', sourceImagePath });
    } catch {
      setCaptureError(true);
    } finally {
      setIsCapturing(false);
    }
  }

  if (flow.screen === 'education') {
    return (
      <Screen>
        <View>
          <Text style={styles.eyebrow}>CAMERA ACCESS</Text>
          <Text style={styles.screenTitle}>Capture a document</Text>
          <Text style={styles.body}>
            Camera access is used only while you scan. Captured pages stay in this app’s private
            storage and are not uploaded.
          </Text>
        </View>
        <View style={styles.actions}>
          <Action label="Continue" onPress={() => void continueToCamera()} primary />
          <Action
            label="Cancel"
            onPress={() => {
              dispatch({ type: 'cancel' });
            }}
          />
        </View>
      </Screen>
    );
  }

  if (flow.screen === 'permission_denied') {
    return (
      <Screen>
        <View>
          <Text style={styles.eyebrow}>CAMERA UNAVAILABLE</Text>
          <Text style={styles.screenTitle}>Permission wasn’t granted</Text>
          <Text style={styles.body}>
            You can return and import a page instead. Camera permission can be enabled later in
            device settings.
          </Text>
        </View>
        <View style={styles.actions}>
          <Action
            label="Back to library"
            onPress={() => {
              dispatch({ type: 'cancel' });
            }}
            primary
          />
        </View>
      </Screen>
    );
  }

  if (flow.screen === 'camera') {
    return (
      <View style={styles.cameraScreen}>
        <StatusBar style="light" />
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" active />
        <View style={styles.cameraHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={() => {
              dispatch({ type: 'cancel' });
            }}
            style={styles.cameraClose}
          >
            <Text style={styles.cameraCloseLabel}>×</Text>
          </Pressable>
          <Text style={styles.cameraInstruction}>Place the document inside the frame</Text>
        </View>
        <View pointerEvents="none" style={styles.documentGuide} />
        <View style={styles.captureControls}>
          {captureError ? (
            <Text accessibilityRole="alert" style={styles.captureError}>
              The page could not be saved. Please try again.
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isCapturing ? 'Capturing page' : 'Capture page'}
            disabled={isCapturing}
            onPress={() => void capturePage()}
            style={[styles.shutter, isCapturing && styles.disabled]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (flow.screen === 'review' && flow.sourceImagePath) {
    return (
      <View style={styles.reviewScreen}>
        <StatusBar style="light" />
        <Image source={{ uri: flow.sourceImagePath }} resizeMode="contain" style={styles.preview} />
        <View style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>Page saved privately</Text>
          <Text style={styles.reviewBody}>The original image is retained on this device.</Text>
          <View style={styles.reviewActions}>
            <Action
              label="Retake"
              onPress={() => {
                dispatch({ type: 'retake' });
              }}
            />
            <Action
              label="Done"
              onPress={() => {
                dispatch({ type: 'cancel' });
              }}
              primary
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <View accessible accessibilityRole="header">
        <Text style={styles.eyebrow}>PRIVATE · ON DEVICE</Text>
        <Text style={styles.title}>PDF Scanner Pro</Text>
        <Text style={styles.body}>
          Capture documents and build searchable PDFs without creating an account.
        </Text>
      </View>
      <View style={styles.actions}>
        <Action
          label="Start scan"
          accessibilityLabel="Start a new document scan"
          onPress={() => {
            dispatch({ type: 'start' });
          }}
          primary
        />
        <Action label="Import from device" accessibilityLabel="Import pages from this device" />
      </View>
      <Text style={styles.note}>
        Camera permission is requested only after you start a scan. Local diagnostics remain off
        unless you enable them in Privacy settings.
      </Text>
    </Screen>
  );
}

function Screen({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>{children}</View>
    </View>
  );
}

function Action({
  label,
  accessibilityLabel,
  onPress,
  primary = false,
}: Readonly<{
  label: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  primary?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={!onPress}
      onPress={onPress}
      style={primary ? styles.primaryButton : styles.secondaryButton}
    >
      <Text style={primary ? styles.primaryLabel : styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F8F7' },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: NativeStatusBar.currentHeight ?? 24,
  },
  eyebrow: { color: '#006B62', fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginTop: 48 },
  title: { color: '#102624', fontSize: 40, fontWeight: '800', lineHeight: 46, marginTop: 12 },
  screenTitle: { color: '#102624', fontSize: 32, fontWeight: '800', lineHeight: 38, marginTop: 12 },
  body: { color: '#3B514E', fontSize: 18, lineHeight: 27, marginTop: 16, maxWidth: 420 },
  actions: { gap: 12 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#007E72',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  primaryLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#8AA6A1',
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
  },
  secondaryLabel: { color: '#174C46', fontSize: 17, fontWeight: '700' },
  note: { color: '#536965', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  cameraScreen: { flex: 1, backgroundColor: '#000000' },
  cameraHeader: { alignItems: 'center', left: 20, position: 'absolute', right: 20, top: 52 },
  cameraClose: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#00000099',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cameraCloseLabel: { color: '#FFFFFF', fontSize: 34, lineHeight: 38 },
  cameraInstruction: {
    backgroundColor: '#00000099',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  documentGuide: {
    borderColor: '#63E6D6',
    borderRadius: 8,
    borderWidth: 3,
    bottom: 190,
    left: 28,
    position: 'absolute',
    right: 28,
    top: 150,
  },
  captureControls: { alignItems: 'center', bottom: 38, left: 0, position: 'absolute', right: 0 },
  captureError: {
    backgroundColor: '#6B1717DD',
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 14,
    padding: 10,
  },
  shutter: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF55',
    borderColor: '#FFFFFF',
    borderRadius: 42,
    borderWidth: 4,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  shutterInner: { backgroundColor: '#FFFFFF', borderRadius: 31, height: 62, width: 62 },
  disabled: { opacity: 0.5 },
  reviewScreen: { flex: 1, backgroundColor: '#101817' },
  preview: { flex: 1, width: '100%' },
  reviewPanel: { backgroundColor: '#F4F8F7', gap: 8, padding: 24, paddingBottom: 36 },
  reviewTitle: { color: '#102624', fontSize: 22, fontWeight: '800' },
  reviewBody: { color: '#536965', fontSize: 15 },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
});
