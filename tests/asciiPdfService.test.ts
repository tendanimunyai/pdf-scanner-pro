import { beforeEach, describe, expect, it, vi } from 'vitest';

const files = new Map<string, string>();

vi.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64' },
  readAsStringAsync: (path: string) => Promise.resolve(files.get(path) ?? ''),
  writeAsStringAsync: (path: string, content: string) => {
    files.set(path, content);
    return Promise.resolve();
  },
  makeDirectoryAsync: () => Promise.resolve(),
  getInfoAsync: (path: string) =>
    Promise.resolve({ exists: files.has(path), size: files.get(path)?.length ?? 0 }),
}));

// The mock must be declared before loading the filesystem-backed service.
// eslint-disable-next-line import/first
import { asciiPdfService } from '../src/infrastructure/pdf/asciiPdfService';

describe('ASCII searchable PDF service', () => {
  beforeEach(() => {
    files.clear();
  });

  it('embeds a page image and invisible OCR text', async () => {
    files.set('/private/page.jpg', 'aGVsbG8=');
    const output = await asciiPdfService.exportSearchable({
      title: 'Test',
      pages: [
        {
          imagePath: '/private/page.jpg',
          width: 100,
          height: 200,
          words: [
            {
              text: 'Hello',
              confidence: 0.99,
              bounds: { x: 0.1, y: 0.2, width: 0.4, height: 0.1 },
            },
          ],
        },
      ],
      quality: 'high',
      outputPath: '/private/out.pdf',
    });
    const pdf = files.get(output) ?? '';
    expect(pdf).toContain('%PDF-1.7');
    expect(pdf).toContain('/Subtype /Image');
    expect(pdf).toContain('/ASCIIHexDecode /DCTDecode');
    expect(pdf).toContain('3 Tr');
    expect(pdf).toContain('(Hello) Tj');
    expect(pdf).toContain('xref');
  });
});
