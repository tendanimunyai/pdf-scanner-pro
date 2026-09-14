import { describe, expect, it, vi } from 'vitest';

import { processPage } from '../src/services/scanPipeline';
import type { ImagingService, OcrService } from '../src/services/scannerServices';

type FakeRepository = {
  enqueueJob: ReturnType<typeof vi.fn>;
  transitionJob: ReturnType<typeof vi.fn>;
  updatePageQuality: ReturnType<typeof vi.fn>;
  updatePageEdit: ReturnType<typeof vi.fn>;
  setOcr: ReturnType<typeof vi.fn>;
  markOcrFailed: ReturnType<typeof vi.fn>;
};

function repository(): FakeRepository {
  return {
    enqueueJob: vi.fn().mockResolvedValue(undefined),
    transitionJob: vi.fn().mockResolvedValue(undefined),
    updatePageQuality: vi.fn().mockResolvedValue(undefined),
    updatePageEdit: vi.fn().mockResolvedValue(undefined),
    setOcr: vi.fn().mockResolvedValue(undefined),
    markOcrFailed: vi.fn().mockResolvedValue(undefined),
  };
}

const imaging: ImagingService = {
  analyzeQuality: () => Promise.resolve({ band: 'excellent', score: 95, reasonCodes: [] }),
  detectCorners: () => Promise.resolve(null),
  processPage: () => Promise.resolve('/private/processed.jpg'),
};

describe('scan processing pipeline', () => {
  it('persists processing and OCR results in order', async () => {
    const repo = repository();
    const ocr: OcrService = {
      recognize: () =>
        Promise.resolve({
          text: 'Hello',
          language: 'en',
          orientation: 0,
          words: [{ text: 'Hello', confidence: 0.9, bounds: { x: 0, y: 0, width: 1, height: 1 } }],
        }),
    };
    await processPage(repo as never, imaging, ocr, {
      documentId: 'd',
      pageId: 'p',
      sourcePath: '/private/source.jpg',
      rotation: 0,
      filter: 'original',
      now: () => '2026-01-01T00:00:00.000Z',
    });
    expect(repo.setOcr).toHaveBeenCalledWith(
      'p',
      expect.objectContaining({ text: 'Hello', confidence: 0.9 }),
      expect.any(String),
    );
    expect(repo.markOcrFailed).not.toHaveBeenCalled();
  });

  it('marks OCR failed without discarding the processed source', async () => {
    const repo = repository();
    const ocr: OcrService = { recognize: () => Promise.reject(new Error('model_unavailable')) };
    await expect(
      processPage(repo as never, imaging, ocr, {
        documentId: 'd',
        pageId: 'p',
        sourcePath: '/private/source.jpg',
        rotation: 0,
        filter: 'original',
        now: () => '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('model_unavailable');
    expect(repo.markOcrFailed).toHaveBeenCalledWith('p', expect.any(String));
    expect(repo.updatePageEdit).toHaveBeenCalledWith(
      'p',
      expect.objectContaining({ processedImagePath: '/private/processed.jpg' }),
      expect.any(String),
    );
  });

  it('does not commit results after cancellation', async () => {
    const repo = repository();
    const controller = new AbortController();
    const cancellableImaging: ImagingService = {
      analyzeQuality: () => {
        controller.abort();
        return Promise.resolve({ band: 'usable' as const, score: 80, reasonCodes: [] as const });
      },
      detectCorners: () => Promise.resolve(null),
      processPage: () => Promise.resolve('/private/processed.jpg'),
    };
    await expect(
      processPage(
        repo as never,
        cancellableImaging,
        { recognize: vi.fn() },
        {
          documentId: 'd',
          pageId: 'p',
          sourcePath: '/private/source.jpg',
          rotation: 0,
          filter: 'original',
          now: () => '2026-01-01T00:00:00.000Z',
          signal: controller.signal,
        },
      ),
    ).rejects.toThrow('export_cancelled');
    expect(repo.updatePageQuality).not.toHaveBeenCalled();
  });
});
