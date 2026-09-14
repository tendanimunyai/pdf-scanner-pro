import { describe, expect, it } from 'vitest';

import { buildPlainTextExport } from '../src/domain/textExport';

describe('plain text export', () => {
  it('preserves page order and separates pages', () => {
    expect(
      buildPlainTextExport([
        { pageNumber: 1, text: ' First page ' },
        { pageNumber: 2, text: 'Second page' },
      ]),
    ).toBe('--- Page 1 ---\nFirst page\n\n--- Page 2 ---\nSecond page');
  });

  it('rejects empty OCR pages instead of creating a misleading export', () => {
    expect(() => buildPlainTextExport([{ pageNumber: 1, text: '   ' }])).toThrow('invalid_input');
  });
});
