const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function sanitizeFilename(title: string, fallback = 'Untitled document'): string {
  const sanitized = title
    .normalize('NFC')
    .split('')
    .filter((character) => character.charCodeAt(0) > 31)
    .join('')
    .replace(/[<>:"/\\|?*]/g, (character) => (character === '/' || character === '\\' ? ' - ' : ''))
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 120);
  const usable = sanitized || fallback;
  return WINDOWS_RESERVED.test(usable) ? `${usable} document` : usable;
}

export type ConfirmedFilenameFields = Readonly<{
  supplier?: string;
  documentNumber?: string;
  date?: string;
}>;

export type FilenamePattern = readonly ('supplier' | 'documentNumber' | 'date' | 'title')[];

/** Suggests a filename only from fields explicitly confirmed by the user. */
export function suggestFilename(
  title: string,
  fields: ConfirmedFilenameFields,
  pattern: FilenamePattern = ['supplier', 'documentNumber', 'date'],
): string {
  const values: Record<string, string | undefined> = {
    supplier: fields.supplier,
    documentNumber: fields.documentNumber,
    date: fields.date,
    title,
  };
  const parts = pattern
    .map((key) => values[key]?.trim())
    .filter((value): value is string => Boolean(value));
  return sanitizeFilename(parts.join(' - ') || title);
}
