import { describe, expect, it, vi } from 'vitest';

import { migrateDatabase } from '../src/infrastructure/database/schema';

describe('database migrations', () => {
  it('creates local document, page, job, and search storage atomically', async () => {
    let migrationSql = '';
    const execAsync = vi.fn((sql: string) => {
      migrationSql = sql;
      return Promise.resolve();
    });
    const withTransactionAsync = vi.fn((task: () => Promise<void>) => task());
    await migrateDatabase({
      execAsync,
      getFirstAsync: () => Promise.resolve({ user_version: 0 }),
      withTransactionAsync,
    });
    expect(withTransactionAsync).toHaveBeenCalledOnce();
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS documents');
    expect(migrationSql).toContain('source_image_path TEXT NOT NULL');
    expect(migrationSql).toContain('ON DELETE CASCADE');
    expect(migrationSql).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS page_search USING fts5');
  });

  it('does not destructively migrate an unknown newer schema', async () => {
    await expect(
      migrateDatabase({
        execAsync: vi.fn(),
        getFirstAsync: () => Promise.resolve({ user_version: 99 }),
        withTransactionAsync: vi.fn(),
      }),
    ).rejects.toThrow(/newer/i);
  });
});
