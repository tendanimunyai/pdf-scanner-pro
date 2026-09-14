import { describe, expect, it } from 'vitest';

import { partitionImports } from '../src/domain/importSelection';

describe('partitionImports', () => {
  it('preserves image order and separates PDF documents', () => {
    const selection = partitionImports([
      { uri: 'file:///page-1.jpg', name: 'page-1.jpg', mimeType: 'image/jpeg' },
      { uri: 'file:///archive.pdf', name: 'archive.pdf', mimeType: 'application/pdf' },
      { uri: 'file:///page-2.png', name: 'page-2.png', mimeType: null },
    ]);

    expect(selection.images.map((file) => file.uri)).toEqual([
      'file:///page-1.jpg',
      'file:///page-2.png',
    ]);
    expect(selection.pdfs.map((file) => file.uri)).toEqual(['file:///archive.pdf']);
  });

  it('rejects unsupported selections instead of treating them as images', () => {
    expect(() =>
      partitionImports([
        { uri: 'file:///notes.txt', name: 'notes.txt', mimeType: 'text/plain' },
      ]),
    ).toThrow('unsupported_file_type');
  });
});
