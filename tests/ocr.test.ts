import { describe, expect, it } from 'vitest';

import { applyOcrCorrections, lowConfidenceWordIds, ocrQualitySummary } from '../src/domain/ocr';
import { canExportSearchable, estimatePdfBytes } from '../src/domain/export';

const words = [
  { id: '1', text: 'T0tal', confidence: 0.6, bounds: { x: 0, y: 0, width: 0.2, height: 0.1 } },
  { id: '2', text: '100', confidence: 0.99, bounds: { x: 0.2, y: 0, width: 0.2, height: 0.1 } },
] as const;

describe('OCR review', () => {
  it('applies corrections without changing source words', () => {
    expect(
      applyOcrCorrections({
        status: 'complete',
        originalText: 'T0tal 100',
        words,
        corrections: [{ wordId: '1', original: 'T0tal', corrected: 'Total' }],
      }),
    ).toBe('Total 100');
    expect(words[0].text).toBe('T0tal');
  });

  it('summarizes failed pages and uncertain words', () => {
    expect(lowConfidenceWordIds(words)).toEqual(['1']);
    expect(
      ocrQualitySummary([
        { status: 'complete', originalText: 'x', words, corrections: [] },
        { status: 'failed', originalText: null, words: [], corrections: [] },
      ]),
    ).toEqual({ failedPages: 1, lowConfidenceWords: 1, ready: false });
  });

  it('estimates bounded export size and blocks incomplete OCR', () => {
    expect(estimatePdfBytes(2, 10_000, 'medium')).toBe(20_096);
    expect(
      canExportSearchable([{ status: 'complete', originalText: 'x', words, corrections: [] }]),
    ).toBe(true);
    expect(
      canExportSearchable([{ status: 'failed', originalText: null, words: [], corrections: [] }]),
    ).toBe(false);
  });
});
