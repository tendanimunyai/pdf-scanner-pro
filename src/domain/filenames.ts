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
