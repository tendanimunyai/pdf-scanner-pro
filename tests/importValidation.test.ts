import { describe, expect, it } from 'vitest';

import { countPdfPages, validateImport } from '../src/services/importValidation';

describe('import validation', () => {
  it('accepts bounded image metadata', () => {
    expect(
      validateImport({
        kind: 'image',
        mimeType: 'image/jpeg',
        byteLength: 1000,
        width: 2000,
        height: 1000,
      }),
    ).toEqual({ valid: true });
  });

  it('rejects unsupported types and oversized resources', () => {
    expect(
      validateImport({
        kind: 'image',
        mimeType: 'text/plain',
        byteLength: 1000,
        width: 100,
        height: 100,
      }).valid,
    ).toBe(false);
    expect(
      validateImport({
        kind: 'image',
        mimeType: 'image/png',
        byteLength: 60_000_000,
        width: 100,
        height: 100,
      }),
    ).toEqual({ valid: false, reason: 'storage_full' });
    expect(
      validateImport({
        kind: 'pdf',
        mimeType: 'application/pdf',
        byteLength: 1000,
        pageCount: 201,
      }),
    ).toEqual({ valid: false, reason: 'invalid_input' });
  });

  it('counts page objects without confusing the Pages tree node', () => {
    expect(countPdfPages('/Type /Pages /Count 2 /Type /Page /Parent 1 0 R /Type /Page')).toBe(2);
  });
});
