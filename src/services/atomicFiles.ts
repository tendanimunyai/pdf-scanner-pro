import * as FileSystem from 'expo-file-system/legacy';

export type FileValidator = (path: string) => Promise<boolean>;

/** Writes a derivative beside its final destination, validates it, then promotes it. */
export async function writeAtomically(
  finalPath: string,
  write: (temporaryPath: string) => Promise<void>,
  validate: FileValidator,
): Promise<void> {
  const temporaryPath = `${finalPath}.tmp-${String(Date.now())}-${Math.random().toString(16).slice(2)}`;
  try {
    await write(temporaryPath);
    if (!(await validate(temporaryPath))) throw new Error('invalid_input');
    const existing = await FileSystem.getInfoAsync(finalPath);
    if (existing.exists) await FileSystem.deleteAsync(finalPath, { idempotent: true });
    await FileSystem.moveAsync({ from: temporaryPath, to: finalPath });
  } finally {
    const temporary = await FileSystem.getInfoAsync(temporaryPath);
    if (temporary.exists) await FileSystem.deleteAsync(temporaryPath, { idempotent: true });
  }
}

export async function removeOwnedFiles(paths: readonly string[]): Promise<void> {
  for (const path of new Set(paths)) {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
  }
}
