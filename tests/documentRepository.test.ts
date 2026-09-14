import { describe, expect, it, vi } from 'vitest';

import { DocumentRepository } from '../src/services/documentRepository';

describe('document duplication recovery', () => {
  it('removes copied files when the metadata transaction fails', async () => {
    const database = {
      getFirstAsync: vi.fn().mockResolvedValue({
        created_at: '2026-01-01',
        thumbnail_path: null,
        pdf_path: null,
        ocr_status: 'complete',
        quality_summary: null,
        folder_id: null,
        tags_json: '[]',
      }),
      getAllAsync: vi.fn().mockResolvedValue([
        {
          id: 'p1',
          source_image_path: '/source.jpg',
          processed_image_path: null,
          position: 0,
          corners_json: null,
          rotation: 0,
          filter: 'original',
          ocr_status: 'complete',
          ocr_text: 'secret',
          ocr_blocks_json: null,
          ocr_confidence: 1,
          ocr_corrections_json: '[]',
          quality_score: 1,
          quality_reasons_json: '[]',
          edit_parameters_json: '{}',
          edit_version: 1,
        },
      ]),
      withTransactionAsync: vi.fn((task: () => Promise<void>) => task()),
      runAsync: vi
        .fn()
        .mockResolvedValueOnce({ changes: 1 })
        .mockRejectedValueOnce(new Error('disk_full')),
    } as never;
    const removeFile = vi.fn().mockResolvedValue(undefined);
    const repository = new DocumentRepository(database);
    await expect(
      repository.duplicateDocument(
        'source',
        'copy',
        'Copy',
        '2026-01-02',
        () => Promise.resolve('/copy.jpg'),
        removeFile,
      ),
    ).rejects.toThrow('disk_full');
    expect(removeFile).toHaveBeenCalledWith('/copy.jpg');
  });
});
