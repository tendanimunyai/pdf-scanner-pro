export const DATABASE_NAME = 'pdf-scanner-pro.db';
export const SCHEMA_VERSION = 2;

export interface MigrationDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync(sql: string): Promise<{ user_version: number } | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

const CREATE_V1 = `
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  thumbnail_path TEXT,
  pdf_path TEXT,
  ocr_status TEXT NOT NULL,
  quality_summary TEXT,
  folder_id TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position >= 0),
  source_image_path TEXT NOT NULL,
  processed_image_path TEXT,
  corners_json TEXT,
  rotation INTEGER NOT NULL DEFAULT 0 CHECK(rotation IN (0, 90, 180, 270)),
  filter TEXT NOT NULL DEFAULT 'original',
  ocr_status TEXT NOT NULL DEFAULT 'not_started',
  ocr_text TEXT,
  ocr_blocks_json TEXT,
  ocr_confidence REAL,
  ocr_corrections_json TEXT NOT NULL DEFAULT '[]',
  quality_score REAL,
  quality_reasons_json TEXT NOT NULL DEFAULT '[]',
  edit_parameters_json TEXT NOT NULL DEFAULT '{}',
  edit_version INTEGER NOT NULL DEFAULT 1,
  UNIQUE(document_id, position)
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  state TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  error_code TEXT
);
CREATE VIRTUAL TABLE IF NOT EXISTS page_search USING fts5(page_id UNINDEXED, document_id UNINDEXED, normalized_text);
CREATE INDEX IF NOT EXISTS pages_document_position ON pages(document_id, position);
PRAGMA user_version = 1;
`;

const MIGRATE_V2 = `
CREATE TABLE IF NOT EXISTS diagnostics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
PRAGMA user_version = 2;
`;

export async function migrateDatabase(database: MigrationDatabase): Promise<void> {
  const row = await database.getFirstAsync('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version > SCHEMA_VERSION) {
    throw new Error(`Database version ${String(version)} is newer than this application supports.`);
  }
  if (version === 0) {
    await database.withTransactionAsync(() => database.execAsync(CREATE_V1));
  }
  if (version < 2) {
    await database.withTransactionAsync(() => database.execAsync(MIGRATE_V2));
  }
}
