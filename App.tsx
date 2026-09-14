import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { File as ExpoFile } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';

import { initialCaptureFlow, reduceCaptureFlow } from './src/features/capture/captureFlow';
import { openApplicationDatabase } from './src/infrastructure/database/openDatabase';
import { DocumentRepository } from './src/services/documentRepository';
import { removeOwnedFiles } from './src/services/atomicFiles';
import type { Document } from './src/domain/models';
import { Analytics } from './src/services/analytics';
import { disabledAnalyticsProvider } from './src/infrastructure/analytics/disabledAnalyticsProvider';
import { nativeShareService } from './src/infrastructure/share/nativeShareService';
import { asciiPdfService } from './src/infrastructure/pdf/asciiPdfService';
import { exportDocument } from './src/services/exportWorkflow';
import { countPdfPages, validateImport } from './src/services/importValidation';
import { partitionImports } from './src/domain/importSelection';

const analytics = new Analytics(disabledAnalyticsProvider);

export default function App() {
  const [flow, dispatch] = useReducer(reduceCaptureFlow, initialCaptureFlow);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);
  const [repository, setRepository] = useState<DocumentRepository | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<readonly Document[]>([]);
  const [documentTitle, setDocumentTitle] = useState('Untitled document');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'modified' | 'title' | 'created'>('modified');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [recoveredJobCount, setRecoveredJobCount] = useState(0);

  useEffect(() => {
    let active = true;
    void openApplicationDatabase()
      .then(async (database) => {
        if (active) {
          const nextRepository = new DocumentRepository(database);
          const recovered = await nextRepository.requeueInterruptedJobs(new Date().toISOString());
          setRecoveredJobCount(recovered);
          setRepository(nextRepository);
          setDocuments(await nextRepository.listDocuments());
          void analytics.track('first_open', {
            app_version: '0.1.0',
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            locale: Intl.DateTimeFormat().resolvedOptions().locale || 'und',
          });
        }
      })
      .catch(() => {
        if (active) setDatabaseError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!repository) return;
    const query = searchQuery.trim();
    void (query ? repository.search(query) : repository.listDocumentsSorted(sortBy)).then(
      setDocuments,
    );
  }, [repository, searchQuery, sortBy]);

  if (databaseError) {
    return (
      <Screen>
        <View>
          <Text style={styles.eyebrow}>LOCAL STORAGE UNAVAILABLE</Text>
          <Text style={styles.screenTitle}>Your library could not be opened</Text>
          <Text style={styles.body}>
            Your documents remain private on this device. Restart the app and try again; no scan
            will be discarded automatically.
          </Text>
        </View>
      </Screen>
    );
  }

  async function continueToCamera() {
    const result = permission?.granted ? permission : await requestPermission();
    void analytics.track('camera_permission_result', {
      outcome: result.granted ? 'granted' : result.canAskAgain ? 'denied' : 'restricted',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    dispatch({ type: 'permission_resolved', granted: result.granted });
  }

  async function capturePage() {
    if (!camera.current || isCapturing) return;
    if (!repository) {
      setCaptureError(true);
      return;
    }
    setIsCapturing(true);
    setCaptureError(false);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!FileSystem.documentDirectory) throw new Error('capture_failed');
      const scanDirectory = `${FileSystem.documentDirectory}scans/in-progress/`;
      await FileSystem.makeDirectoryAsync(scanDirectory, { intermediates: true });
      const sourceImagePath = `${scanDirectory}${Crypto.randomUUID()}.jpg`;
      await FileSystem.moveAsync({ from: photo.uri, to: sourceImagePath });
      const activeDocumentId = documentId ?? Crypto.randomUUID();
      if (!documentId) {
        await repository.createDocument(activeDocumentId, documentTitle, new Date().toISOString());
        setDocumentId(activeDocumentId);
      }
      await repository.addPage(
        activeDocumentId,
        { id: Crypto.randomUUID(), sourceImagePath },
        new Date().toISOString(),
      );
      setDocuments(await repository.listDocuments());
      dispatch({ type: 'captured', sourceImagePath });
    } catch {
      setCaptureError(true);
    } finally {
      setIsCapturing(false);
    }
  }

  async function duplicateDocument(document: Document) {
    if (!repository || !FileSystem.documentDirectory) return;
    const duplicateId = Crypto.randomUUID();
    const directory = `${FileSystem.documentDirectory}scans/in-progress/${duplicateId}/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const copied = new Set<string>();
    const copyFile = async (sourcePath: string) => {
      const filename = sourcePath.split('/').pop() ?? 'page.jpg';
      const destination = `${directory}${Crypto.randomUUID()}-${filename}`;
      await FileSystem.copyAsync({ from: sourcePath, to: destination });
      copied.add(destination);
      return destination;
    };
    try {
      await repository.duplicateDocument(
        document.id,
        duplicateId,
        `Copy of ${document.title}`,
        new Date().toISOString(),
        copyFile,
        async (path) => {
          copied.delete(path);
          await FileSystem.deleteAsync(path, { idempotent: true });
        },
      );
      setDocuments(await repository.listDocuments());
    } catch {
      await Promise.all(
        [...copied].map((path) => FileSystem.deleteAsync(path, { idempotent: true })),
      );
    }
  }

  async function importFromDevice() {
    if (!repository || isImporting || !FileSystem.documentDirectory) return;
    setIsImporting(true);
    setImportError(false);
    const createdDocumentIds: string[] = [];
    const copiedPaths: string[] = [];
    try {
      const picked = await ExpoFile.pickFileAsync({
        multipleFiles: true,
        mimeTypes: ['image/*', 'application/pdf'],
      });
      if (picked.canceled || picked.result.length === 0) return;
      const selection = partitionImports(
        picked.result.map((file) => ({ uri: file.uri, name: file.name, mimeType: file.type || null })),
      );
      const now = new Date().toISOString();

      if (selection.images.length > 0) {
        const id = Crypto.randomUUID();
        const directory = `${FileSystem.documentDirectory}scans/in-progress/${id}/`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        await repository.createDocument(id, 'Imported document', now);
        createdDocumentIds.push(id);
        for (const selected of selection.images) {
          const info = await FileSystem.getInfoAsync(selected.uri);
          const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            Image.getSize(
              selected.uri,
              (width, height) => {
                resolve({ width, height });
              },
              reject,
            );
          });
          const validation = validateImport({
            kind: 'image',
            mimeType: selected.mimeType ?? `image/${selected.name.split('.').pop() ?? 'jpeg'}`,
            byteLength: 'size' in info ? info.size : 0,
            width: size.width,
            height: size.height,
          });
          if (!validation.valid) throw new Error(validation.reason ?? 'invalid_input');
          const suffix = selected.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? '.jpg';
          const destination = `${directory}${Crypto.randomUUID()}${suffix}`;
          await FileSystem.copyAsync({ from: selected.uri, to: destination });
          copiedPaths.push(destination);
          await repository.addPage(
            id,
            { id: Crypto.randomUUID(), sourceImagePath: destination },
            now,
          );
        }
      }

      for (const selected of selection.pdfs) {
        const source = new ExpoFile(selected.uri);
        const info = await FileSystem.getInfoAsync(selected.uri);
        const validation = validateImport({
          kind: 'pdf',
          mimeType: 'application/pdf',
          byteLength: 'size' in info ? info.size : 0,
          pageCount: countPdfPages(await source.text()),
        });
        if (!validation.valid) throw new Error(validation.reason ?? 'invalid_input');
        const id = Crypto.randomUUID();
        const directory = `${FileSystem.documentDirectory}scans/imported/`;
        const destination = `${directory}${id}.pdf`;
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        await FileSystem.copyAsync({ from: selected.uri, to: destination });
        copiedPaths.push(destination);
        await repository.createPdfDocument(id, selected.name.replace(/\.pdf$/i, ''), destination, now);
        createdDocumentIds.push(id);
      }
      setDocuments(await repository.listDocuments());
    } catch {
      for (const id of createdDocumentIds) {
        await repository.deleteDocument(id).catch(() => []);
      }
      await removeOwnedFiles(copiedPaths);
      setImportError(true);
    } finally {
      setIsImporting(false);
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
          {captureError ? (
            <Text accessibilityRole="alert" style={styles.reviewError}>
              The PDF could not be created. Your captured page is still safe; try again.
            </Text>
          ) : null}
          <TextInput
            accessibilityLabel="Document title"
            onChangeText={setDocumentTitle}
            placeholder="Document title"
            style={styles.titleInput}
            value={documentTitle}
          />
          <View style={styles.reviewActions}>
            <Action
              label="Retake"
              onPress={() => {
                dispatch({ type: 'retake' });
              }}
            />
            <Action
              label="Add another page"
              onPress={() => {
                dispatch({ type: 'retake' });
              }}
            />
            <Action
              label="Create PDF"
              onPress={() => {
                void (async () => {
                  try {
                    if (documentId && repository) {
                      await repository.renameDocument(
                        documentId,
                        documentTitle,
                        new Date().toISOString(),
                      );
                      const pages = await repository.listPages(documentId);
                      const pdfPages = await Promise.all(
                        pages.map(async (page) => {
                          const imagePath = page.processedImagePath ?? page.sourceImagePath;
                          const size = await new Promise<{ width: number; height: number }>(
                            (resolve, reject) => {
                              Image.getSize(
                                imagePath,
                                (width, height) => {
                                  resolve({ width, height });
                                },
                                (error) => {
                                  reject(
                                    error instanceof Error ? error : new Error('invalid_input'),
                                  );
                                },
                              );
                            },
                          );
                          return {
                            imagePath,
                            width: size.width,
                            height: size.height,
                            words: [],
                            ocr: {
                              status: 'failed' as const,
                              originalText: null,
                              words: [],
                              corrections: [],
                            },
                          };
                        }),
                      );
                      if (!FileSystem.documentDirectory) throw new Error('storage_full');
                      const outputPath = `${FileSystem.documentDirectory}scans/exports/${documentId}.pdf`;
                      const pdfPath = await exportDocument(repository, asciiPdfService, {
                        documentId,
                        title: documentTitle,
                        pages: pdfPages,
                        quality: 'high',
                        outputPath,
                        now: () => new Date().toISOString(),
                        mode: 'image_only',
                      });
                      await repository.setPdfPath(documentId, pdfPath, new Date().toISOString());
                      setDocuments(await repository.listDocuments());
                    }
                    dispatch({ type: 'cancel' });
                  } catch {
                    setCaptureError(true);
                  }
                })();
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
      {documents.length > 0 ? (
        <View style={styles.library}>
          <Text style={styles.libraryTitle}>Your documents</Text>
          <TextInput
            accessibilityLabel="Search documents"
            onChangeText={setSearchQuery}
            placeholder="Search title or recognized text"
            placeholderTextColor="#78908B"
            style={styles.searchInput}
            value={searchQuery}
          />
          <View style={styles.sortRow} accessibilityRole="radiogroup">
            {(['modified', 'created', 'title'] as const).map((option) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: sortBy === option }}
                key={option}
                onPress={() => {
                  setSortBy(option);
                }}
                style={[styles.sortButton, sortBy === option && styles.sortButtonSelected]}
              >
                <Text style={sortBy === option ? styles.sortLabelSelected : styles.sortLabel}>
                  {option === 'modified' ? 'Recent' : option === 'created' ? 'Created' : 'Title'}
                </Text>
              </Pressable>
            ))}
          </View>
          {documents.slice(0, 5).map((document) => (
            <View key={document.id} style={styles.documentRow}>
              <View style={styles.documentText}>
                <Text style={styles.documentName}>{document.title}</Text>
                <Text style={styles.documentMeta}>
                  {document.pageCount} page{document.pageCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={`Delete ${document.title}`}
                accessibilityRole="button"
                onPress={() => {
                  if (!repository) return;
                  Alert.alert(
                    'Delete document?',
                    'This removes the document and its local files.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          void repository
                            .deleteDocument(document.id)
                            .then(removeOwnedFiles)
                            .then(async () => {
                              setDocuments(await repository.listDocuments());
                            });
                        },
                      },
                    ],
                  );
                }}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteLabel}>Delete</Text>
              </Pressable>
              {document.pdfPath
                ? (() => {
                    const pdfPath = document.pdfPath;
                    return (
                      <Pressable
                        accessibilityLabel={`Share ${document.title}`}
                        accessibilityRole="button"
                        onPress={() => {
                          void nativeShareService.shareFile(pdfPath, document.title);
                        }}
                        style={styles.shareButton}
                      >
                        <Text style={styles.shareLabel}>Share</Text>
                      </Pressable>
                    );
                  })()
                : null}
              <Pressable
                accessibilityLabel={`Duplicate ${document.title}`}
                accessibilityRole="button"
                onPress={() => {
                  void duplicateDocument(document);
                }}
                style={styles.shareButton}
              >
                <Text style={styles.shareLabel}>Duplicate</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : searchQuery ? (
        <View style={styles.library}>
          <TextInput
            accessibilityLabel="Search documents"
            onChangeText={setSearchQuery}
            placeholder="Search title or recognized text"
            placeholderTextColor="#78908B"
            style={styles.searchInput}
            value={searchQuery}
          />
          <Text style={styles.emptyLibrary}>No documents match “{searchQuery}”.</Text>
        </View>
      ) : null}
      {recoveredJobCount > 0 ? (
        <Text accessibilityRole="alert" style={styles.recoveryNotice}>
          {recoveredJobCount} interrupted operation{recoveredJobCount === 1 ? '' : 's'} queued to
          resume safely.
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Action
          label="Start scan"
          accessibilityLabel="Start a new document scan"
          onPress={() => {
            void analytics.track('scan_started', {
              entry_point: 'library',
              platform: Platform.OS === 'ios' ? 'ios' : 'android',
            });
            dispatch({ type: 'start' });
          }}
          primary
        />
        <Action
          label={isImporting ? 'Importing…' : 'Import from device'}
          accessibilityLabel="Import images or PDFs from this device"
          disabled={isImporting}
          onPress={() => void importFromDevice()}
        />
        {importError ? (
          <Text accessibilityRole="alert" style={styles.captureError}>
            The selected files could not be imported. Originals were left unchanged.
          </Text>
        ) : null}
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
  disabled = false,
}: Readonly<{
  label: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        primary ? styles.primaryButton : styles.secondaryButton,
        disabled && styles.disabled,
      ]}
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
  recoveryNotice: {
    backgroundColor: '#E7F1D5',
    borderRadius: 10,
    color: '#37511A',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
  },
  library: { gap: 8, marginTop: 20 },
  libraryTitle: { color: '#174C46', fontSize: 16, fontWeight: '700' },
  sortRow: { flexDirection: 'row', gap: 8 },
  sortButton: {
    borderColor: '#B8C9C5',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  sortButtonSelected: { backgroundColor: '#D8EEEA', borderColor: '#007E72' },
  sortLabel: { color: '#536965', fontSize: 13, fontWeight: '600' },
  sortLabelSelected: { color: '#006B62', fontSize: 13, fontWeight: '700' },
  documentRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  documentText: { flex: 1 },
  documentName: { color: '#102624', fontSize: 16, fontWeight: '600' },
  documentMeta: { color: '#536965', fontSize: 13, marginTop: 4 },
  deleteButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  deleteLabel: { color: '#A43A3A', fontSize: 14, fontWeight: '700' },
  shareButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  shareLabel: { color: '#006B62', fontSize: 14, fontWeight: '700' },
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
  reviewError: { color: '#A43A3A', fontSize: 14, lineHeight: 20 },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    color: '#102624',
    fontSize: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C7D9D5',
    borderRadius: 10,
    borderWidth: 1,
    color: '#102624',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  emptyLibrary: { color: '#536965', fontSize: 15, marginTop: 16 },
  reviewActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
});
