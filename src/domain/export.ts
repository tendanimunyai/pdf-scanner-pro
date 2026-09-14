import type { OcrPage } from './ocr';

export type ExportQuality = 'low' | 'medium' | 'high';

export function estimatePdfBytes(
  pageCount: number,
  averageImageBytes: number,
  quality: ExportQuality,
): number {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || averageImageBytes < 0)
    throw new Error('invalid_input');
  const multiplier = quality === 'low' ? 0.55 : quality === 'medium' ? 0.8 : 1;
  return Math.ceil(pageCount * averageImageBytes * multiplier + pageCount * 2_048);
}

export function canExportSearchable(pages: readonly OcrPage[]): boolean {
  return pages.length > 0 && pages.every((page) => page.status === 'complete');
}
