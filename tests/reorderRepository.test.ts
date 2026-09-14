import { describe, expect, it, vi } from 'vitest';

import { DocumentRepository } from '../src/services/documentRepository';

describe('repository page reorder', () => {
  it('uses temporary positions and persists the requested order atomically', async () => {
    const runAsync = vi.fn().mockResolvedValue({ changes: 1 });
    const database = {
      getAllAsync: vi.fn().mockResolvedValue([
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
      ]),
      runAsync,
      withTransactionAsync: vi.fn((task: () => Promise<void>) => task()),
    } as never;
    await new DocumentRepository(database).reorderPages('doc', ['b', 'a'], 'now');
    expect(runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('position = ?'),
      3,
      'a',
      'doc',
    );
    expect(runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('position = ?'),
      0,
      'b',
      'doc',
    );
    expect(runAsync).toHaveBeenLastCalledWith(
      'UPDATE documents SET updated_at = ? WHERE id = ?',
      'now',
      'doc',
    );
  });
});
