export const DEFAULT_STORAGE_HEADROOM_BYTES = 5 * 1024 * 1024;

export async function ensureStorageAvailable(
  estimatedBytes: number,
  getFreeBytes: () => Promise<number>,
  headroomBytes = DEFAULT_STORAGE_HEADROOM_BYTES,
): Promise<void> {
  if (!Number.isSafeInteger(estimatedBytes) || estimatedBytes < 0) throw new Error('invalid_input');
  const freeBytes = await getFreeBytes();
  if (!Number.isSafeInteger(freeBytes) || freeBytes < estimatedBytes + headroomBytes)
    throw new Error('storage_full');
}
