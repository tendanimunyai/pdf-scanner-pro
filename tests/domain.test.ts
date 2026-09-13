import { describe, expect, it } from 'vitest';

import { reorderPages } from '../src/domain/documents';
import { sanitizeFilename } from '../src/domain/filenames';
import { normalizeSearchText } from '../src/domain/search';
import { createJob, transitionJob } from '../src/domain/jobs';

describe('document page ordering', () => {
  it('reorders stable page ids and rewrites positions without changing identity', () => {
    const pages = [
      { id: 'page-a', position: 0 },
      { id: 'page-b', position: 1 },
      { id: 'page-c', position: 2 },
    ];

    expect(reorderPages(pages, ['page-c', 'page-a', 'page-b'])).toEqual([
      { id: 'page-c', position: 0 },
      { id: 'page-a', position: 1 },
      { id: 'page-b', position: 2 },
    ]);
    expect(pages[0]).toEqual({ id: 'page-a', position: 0 });
  });

  it('rejects missing or duplicate page ids', () => {
    const pages = [
      { id: 'page-a', position: 0 },
      { id: 'page-b', position: 1 },
    ];
    expect(() => reorderPages(pages, ['page-a'])).toThrow(/every page/i);
    expect(() => reorderPages(pages, ['page-a', 'page-a'])).toThrow(/every page/i);
  });
});

describe('safe local text utilities', () => {
  it('sanitizes platform-reserved filenames while preserving a useful title', () => {
    expect(sanitizeFilename('  Invoice: 42 / ACME.  ')).toBe('Invoice 42 - ACME');
    expect(sanitizeFilename('CON')).toBe('CON document');
  });

  it('normalizes search without replacing original OCR text', () => {
    const original = '  Café\nINVOICE № 42  ';
    expect(normalizeSearchText(original)).toBe('cafe invoice no 42');
    expect(original).toBe('  Café\nINVOICE № 42  ');
  });
});

describe('persisted jobs', () => {
  it('permits explicit retry and cancellation transitions', () => {
    const queued = createJob('job-1', 'ocr', 'page-1', '2026-01-01T00:00:00.000Z');
    const running = transitionJob(queued, 'running', '2026-01-01T00:00:01.000Z');
    const failed = transitionJob(
      running,
      'failure',
      '2026-01-01T00:00:02.000Z',
      'processing_failed',
    );
    expect(transitionJob(failed, 'queued', '2026-01-01T00:00:03.000Z').attempt).toBe(2);
    expect(transitionJob(running, 'cancelled', '2026-01-01T00:00:02.000Z').state).toBe('cancelled');
  });

  it('rejects invalid or unredacted failures', () => {
    const job = createJob('job-1', 'export', 'doc-1', '2026-01-01T00:00:00.000Z');
    expect(() => transitionJob(job, 'success', '2026-01-01T00:00:01.000Z')).toThrow();
    expect(() =>
      transitionJob(job, 'failure', '2026-01-01T00:00:01.000Z', 'file /private/invoice.pdf'),
    ).toThrow();
  });
});
