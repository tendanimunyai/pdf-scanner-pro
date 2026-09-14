import type { OcrStatus } from './models';

export type OcrWord = Readonly<{
  id: string;
  text: string;
  confidence: number | null;
  bounds: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

export type OcrCorrection = Readonly<{ wordId: string; original: string; corrected: string }>;

export type OcrPage = Readonly<{
  status: OcrStatus;
  originalText: string | null;
  words: readonly OcrWord[];
  corrections: readonly OcrCorrection[];
}>;

export function applyOcrCorrections(page: OcrPage): string {
  const corrections = new Map(
    page.corrections.map((correction) => [correction.wordId, correction.corrected]),
  );
  return page.words
    .map((word) => corrections.get(word.id) ?? word.text)
    .join(' ')
    .trim();
}

export function lowConfidenceWordIds(
  words: readonly OcrWord[],
  threshold = 0.8,
): readonly string[] {
  return words
    .filter((word) => word.confidence !== null && word.confidence < threshold)
    .map((word) => word.id);
}

export function ocrQualitySummary(
  pages: readonly OcrPage[],
): Readonly<{ failedPages: number; lowConfidenceWords: number; ready: boolean }> {
  const failedPages = pages.filter((page) => page.status === 'failed').length;
  const lowConfidenceWords = pages.reduce(
    (count, page) => count + lowConfidenceWordIds(page.words).length,
    0,
  );
  return {
    failedPages,
    lowConfidenceWords,
    ready: failedPages === 0 && pages.every((page) => page.status === 'complete'),
  };
}
