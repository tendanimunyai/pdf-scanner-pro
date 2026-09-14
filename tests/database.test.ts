import { describe, expect, it, vi } from 'vitest';

import { migrateDatabase } from '../src/infrastructure/database/schema';

describe('database migrations', () => {
  it('creates local document, page, job, and search storage atomically', async () => {
    let migrationSql = '';
    const execAsync = vi.fn((sql: string) => {
      migrationSql += sql;
      return Promise.resolve();
    });
    const withTransactionAsync = vi.fn((task: () => Promise<void>) => task());
    await migrateDatabase({
      execAsync,
      getFirstAsync: () => Promise.resolve({ user_version: 0 }),
      withTransactionAsync,
    });
    expect(withTransactionAsync).toHaveBeenCalledTimes(2);
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS documents');
    expect(migrationSql).toContain('source_image_path TEXT NOT NULL');
    expect(migrationSql).toContain('ON DELETE CASCADE');
    expect(migrationSql).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS page_search USING fts5');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS diagnostics_events');
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

  it('does not rerun migrations for the current schema version', async () => {
    const withTransactionAsync = vi.fn();
    await migrateDatabase({
      execAsync: vi.fn(),
      getFirstAsync: () => Promise.resolve({ user_version: 2 }),
      withTransactionAsync,
    });
    expect(withTransactionAsync).not.toHaveBeenCalled();
  });
});
