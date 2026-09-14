export type ImportKind = 'image' | 'pdf';
export type ImportMetadata = Readonly<{
  kind: ImportKind;
  mimeType: string | null;
  byteLength: number;
  width?: number;
  height?: number;
  pageCount?: number;
}>;

export type ImportValidation = Readonly<{
  valid: boolean;
  reason?: 'invalid_input' | 'storage_full';
}>;

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_PAGES = 200;

/**
 * Best-effort page count for ordinary, unencrypted PDFs. It intentionally
 * rejects an unknown count at the call site rather than treating malformed
 * input as safe. The parser is only used for resource bounding; a native PDF
 * renderer remains responsible for actual rendering.
 */
export function countPdfPages(pdfText: string): number {
  return (pdfText.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

export function validateImport(metadata: ImportMetadata): ImportValidation {
  if (
    !Number.isSafeInteger(metadata.byteLength) ||
    metadata.byteLength <= 0 ||
    metadata.byteLength > MAX_BYTES
  ) {
    return {
      valid: false,
      reason: metadata.byteLength > MAX_BYTES ? 'storage_full' : 'invalid_input',
    };
  }
  if (metadata.kind === 'image') {
    if (
      !['image/jpeg', 'image/png', 'image/heic', 'image/webp'].includes(metadata.mimeType ?? '')
    ) {
      return { valid: false, reason: 'invalid_input' };
    }
    const { width, height } = metadata;
    if (
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width <= 0 ||
      height <= 0 ||
      width * height > MAX_PIXELS
    ) {
      return { valid: false, reason: 'invalid_input' };
    }
  } else {
    const { pageCount } = metadata;
    if (
      metadata.mimeType !== 'application/pdf' ||
      typeof pageCount !== 'number' ||
      !Number.isSafeInteger(pageCount) ||
      pageCount <= 0 ||
      pageCount > MAX_PAGES
    ) {
      return { valid: false, reason: 'invalid_input' };
    }
  }
  return { valid: true };
}
