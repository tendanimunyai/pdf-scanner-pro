import { describe, expect, it } from 'vitest';

import { ensureStorageAvailable } from '../src/services/storagePreflight';

describe('export storage preflight', () => {
  it('accepts an estimate with sufficient headroom', async () => {
    await expect(
      ensureStorageAvailable(100, () => Promise.resolve(10_000), 1000),
    ).resolves.toBeUndefined();
  });

  it('returns an allowlisted storage error before export begins', async () => {
    await expect(ensureStorageAvailable(9000, () => Promise.resolve(10_000), 2000)).rejects.toThrow(
      'storage_full',
    );
  });
});
