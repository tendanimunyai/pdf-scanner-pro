export type TextExportPage = Readonly<{ pageNumber: number; text: string }>;

/** Build a copy/share-friendly text representation without leaking metadata. */
export function buildPlainTextExport(pages: readonly TextExportPage[]): string {
  if (pages.length === 0) throw new Error('invalid_input');
  return pages
    .map((page, index) => {
      if (!Number.isSafeInteger(page.pageNumber) || page.pageNumber < 1 || !page.text.trim())
        throw new Error('invalid_input');
      const separator = index === 0 ? '' : '\n\n';
      return `${separator}--- Page ${String(page.pageNumber)} ---\n${page.text.trim()}`;
    })
    .join('');
}
