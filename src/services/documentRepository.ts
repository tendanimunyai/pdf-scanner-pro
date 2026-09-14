import type { SQLiteDatabase } from 'expo-sqlite';

import { normalizeSearchText } from '../domain/search';
import { reorderPages } from '../domain/documents';
import type { Document, Page, PageFilter } from '../domain/models';
import type { JobKind, JobState, PersistedJob, SafeErrorCode } from '../domain/jobs';

function parseStringArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')
    ? parsed
    : [];
}

type DocumentRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  thumbnail_path: string | null;
  pdf_path: string | null;
  ocr_status: Document['ocrStatus'];
  quality_summary: Document['qualitySummary'];
  folder_id: string | null;
  tags_json: string;
  page_count: number;
};

type PageRow = {
  id: string;
  document_id: string;
  position: number;
  source_image_path: string;
  processed_image_path: string | null;
  corners_json: string | null;
  rotation: Page['rotation'];
  filter: PageFilter;
  ocr_status: Page['ocrStatus'];
  quality_score: number | null;
  quality_reasons_json: string;
  edit_parameters_json: string;
  edit_version: number;
};

export type NewPage = Readonly<{
  id: string;
  sourceImagePath: string;
}>;

export class DocumentRepository {
  public constructor(private readonly database: SQLiteDatabase) {}

  async createDocument(id: string, title: string, now: string): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO documents (id, title, created_at, updated_at, ocr_status) VALUES (?, ?, ?, ?, 'not_started')`,
      id,
      title,
      now,
      now,
    );
  }

  async createPdfDocument(id: string, title: string, pdfPath: string, now: string): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO documents (id, title, created_at, updated_at, pdf_path, ocr_status) VALUES (?, ?, ?, ?, ?, 'not_started')`,
      id,
      title.trim() || 'Imported PDF',
      now,
      now,
      pdfPath,
    );
  }

  async enqueueJob(job: PersistedJob): Promise<void> {
    await this.database.runAsync(
      `INSERT OR REPLACE INTO jobs (id, kind, subject_id, state, attempt, created_at, updated_at, error_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      job.id,
      job.kind,
      job.subjectId,
      job.state,
      job.attempt,
      job.createdAt,
      job.updatedAt,
      job.errorCode ?? null,
    );
  }

  async transitionJob(
    id: string,
    state: JobState,
    now: string,
    errorCode?: SafeErrorCode,
  ): Promise<void> {
    await this.database.runAsync(
      'UPDATE jobs SET state = ?, updated_at = ?, error_code = ? WHERE id = ?',
      state,
      now,
      errorCode ?? null,
      id,
    );
  }

  async listRecoverableJobs(): Promise<readonly PersistedJob[]> {
    const rows = await this.database.getAllAsync<{
      id: string;
      kind: JobKind;
      subject_id: string;
      state: JobState;
      attempt: number;
      created_at: string;
      updated_at: string;
      error_code: SafeErrorCode | null;
    }>(
      `SELECT * FROM jobs WHERE state IN ('queued', 'running', 'failure') ORDER BY created_at ASC`,
    );
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      subjectId: row.subject_id,
      state: row.state,
      attempt: row.attempt,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.error_code ? { errorCode: row.error_code } : {}),
    }));
  }

  async requeueInterruptedJobs(now: string): Promise<number> {
    const result = await this.database.runAsync(
      `UPDATE jobs SET state = 'queued', attempt = attempt + 1, updated_at = ?, error_code = NULL WHERE state = 'running'`,
      now,
    );
    return result.changes;
  }

  async renameDocument(documentId: string, title: string, now: string): Promise<void> {
    await this.database.runAsync(
      'UPDATE documents SET title = ?, updated_at = ? WHERE id = ?',
      title.trim() || 'Untitled document',
      now,
      documentId,
    );
  }

  async setPdfPath(documentId: string, pdfPath: string, now: string): Promise<void> {
    await this.database.runAsync(
      "UPDATE documents SET pdf_path = ?, updated_at = ?, ocr_status = CASE WHEN ocr_status = 'complete' THEN ocr_status ELSE 'not_started' END WHERE id = ?",
      pdfPath,
      now,
      documentId,
    );
  }

  async organizeDocument(
    documentId: string,
    organization: Readonly<{ folderId: string | null; tags: readonly string[] }>,
    now: string,
  ): Promise<void> {
    const tags = [...new Set(organization.tags.map((tag) => tag.trim()).filter(Boolean))].slice(
      0,
      50,
    );
    await this.database.runAsync(
      'UPDATE documents SET folder_id = ?, tags_json = ?, updated_at = ? WHERE id = ?',
      organization.folderId,
      JSON.stringify(tags),
      now,
      documentId,
    );
  }

  async addPage(documentId: string, page: NewPage, now: string): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      const position = await this.database.getFirstAsync<{ next_position: number }>(
        'SELECT COALESCE(MAX(position) + 1, 0) AS next_position FROM pages WHERE document_id = ?',
        documentId,
      );
      await this.database.runAsync(
        `INSERT INTO pages (id, document_id, position, source_image_path) VALUES (?, ?, ?, ?)`,
        page.id,
        documentId,
        position?.next_position ?? 0,
        page.sourceImagePath,
      );
      await this.database.runAsync(
        'UPDATE documents SET updated_at = ? WHERE id = ?',
        now,
        documentId,
      );
    });
  }

  async reorderPages(
    documentId: string,
    orderedPageIds: readonly string[],
    now: string,
  ): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      const pages = await this.database.getAllAsync<{ id: string; position: number }>(
        'SELECT id, position FROM pages WHERE document_id = ? ORDER BY position ASC',
        documentId,
      );
      const reordered = reorderPages(pages, orderedPageIds);
      const offset = pages.length + 1;
      for (const page of pages) {
        await this.database.runAsync(
          'UPDATE pages SET position = ? WHERE id = ? AND document_id = ?',
          page.position + offset,
          page.id,
          documentId,
        );
      }
      for (const page of reordered) {
        await this.database.runAsync(
          'UPDATE pages SET position = ? WHERE id = ? AND document_id = ?',
          page.position,
          page.id,
          documentId,
        );
      }
      await this.database.runAsync(
        'UPDATE documents SET updated_at = ? WHERE id = ?',
        now,
        documentId,
      );
    });
  }

  async updatePageEdit(
    pageId: string,
    edit: Readonly<{
      rotation: Page['rotation'];
      filter: PageFilter;
      processedImagePath?: string | null;
    }>,
    now: string,
  ): Promise<void> {
    await this.database.runAsync(
      `UPDATE pages SET rotation = ?, filter = ?, processed_image_path = ?, edit_version = edit_version + 1 WHERE id = ?`,
      edit.rotation,
      edit.filter,
      edit.processedImagePath ?? null,
      pageId,
    );
    await this.database.runAsync(
      `UPDATE documents SET updated_at = ? WHERE id = (SELECT document_id FROM pages WHERE id = ?)`,
      now,
      pageId,
    );
  }

  async updatePageQuality(
    pageId: string,
    quality: Readonly<{ score: number; reasons: readonly string[] }>,
    now: string,
  ): Promise<void> {
    await this.database.runAsync(
      'UPDATE pages SET quality_score = ?, quality_reasons_json = ? WHERE id = ?',
      quality.score,
      JSON.stringify(quality.reasons),
      pageId,
    );
    await this.database.runAsync(
      'UPDATE documents SET updated_at = ? WHERE id = (SELECT document_id FROM pages WHERE id = ?)',
      now,
      pageId,
    );
  }

  async setOcr(
    pageId: string,
    result: Readonly<{ text: string; confidence: number | null; blocksJson?: string }>,
    now: string,
  ): Promise<void> {
    await this.database.withTransactionAsync(async () => {
      const page = await this.database.getFirstAsync<{ document_id: string }>(
        'SELECT document_id FROM pages WHERE id = ?',
        pageId,
      );
      if (!page) return;
      await this.database.runAsync(
        `UPDATE pages SET ocr_status = 'complete', ocr_text = ?, ocr_blocks_json = ?, ocr_confidence = ? WHERE id = ?`,
        result.text,
        result.blocksJson ?? null,
        result.confidence,
        pageId,
      );
      await this.database.runAsync('DELETE FROM page_search WHERE page_id = ?', pageId);
      await this.database.runAsync(
        'INSERT INTO page_search (page_id, document_id, normalized_text) VALUES (?, ?, ?)',
        pageId,
        page.document_id,
        normalizeSearchText(result.text),
      );
      await this.database.runAsync(
        'UPDATE documents SET updated_at = ? WHERE id = ?',
        now,
        page.document_id,
      );
    });
  }

  async markOcrFailed(pageId: string, now: string): Promise<void> {
    await this.database.runAsync("UPDATE pages SET ocr_status = 'failed' WHERE id = ?", pageId);
    await this.database.runAsync(
      'UPDATE documents SET updated_at = ? WHERE id = (SELECT document_id FROM pages WHERE id = ?)',
      now,
      pageId,
    );
  }

  async listDocuments(): Promise<readonly Document[]> {
    const rows = await this.database.getAllAsync<DocumentRow>(
      `SELECT d.*, COUNT(p.id) AS page_count FROM documents d LEFT JOIN pages p ON p.document_id = d.id GROUP BY d.id ORDER BY d.updated_at DESC`,
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pageCount: row.page_count,
      thumbnailPath: row.thumbnail_path,
      pdfPath: row.pdf_path,
      ocrStatus: row.ocr_status,
      qualitySummary: row.quality_summary,
      folderId: row.folder_id,
      tags: parseStringArray(row.tags_json),
    }));
  }

  async listDocumentsSorted(by: 'title' | 'created' | 'modified'): Promise<readonly Document[]> {
    const order =
      by === 'title'
        ? 'd.title COLLATE NOCASE ASC'
        : by === 'created'
          ? 'd.created_at DESC'
          : 'd.updated_at DESC';
    const rows = await this.database.getAllAsync<DocumentRow>(
      `SELECT d.*, COUNT(p.id) AS page_count FROM documents d LEFT JOIN pages p ON p.document_id = d.id GROUP BY d.id ORDER BY ${order}`,
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pageCount: row.page_count,
      thumbnailPath: row.thumbnail_path,
      pdfPath: row.pdf_path,
      ocrStatus: row.ocr_status,
      qualitySummary: row.quality_summary,
      folderId: row.folder_id,
      tags: parseStringArray(row.tags_json),
    }));
  }

  async duplicateDocument(
    sourceId: string,
    duplicateId: string,
    title: string,
    now: string,
    copyFile: (path: string) => Promise<string>,
    removeFile?: (path: string) => Promise<void>,
  ): Promise<void> {
    const source = await this.database.getFirstAsync<{
      created_at: string;
      thumbnail_path: string | null;
      pdf_path: string | null;
      ocr_status: Document['ocrStatus'];
      quality_summary: Document['qualitySummary'];
      folder_id: string | null;
      tags_json: string;
    }>(
      'SELECT created_at, thumbnail_path, pdf_path, ocr_status, quality_summary, folder_id, tags_json FROM documents WHERE id = ?',
      sourceId,
    );
    if (!source) throw new Error('invalid_input');
    const pages = await this.database.getAllAsync<PageRow>(
      'SELECT * FROM pages WHERE document_id = ? ORDER BY position ASC',
      sourceId,
    );
    const copiedPaths: string[] = [];
    try {
      const duplicatedPdfPath = source.pdf_path ? await copyFile(source.pdf_path) : null;
      if (duplicatedPdfPath) copiedPaths.push(duplicatedPdfPath);
      const duplicatedThumbnailPath = source.thumbnail_path
        ? await copyFile(source.thumbnail_path)
        : null;
      if (duplicatedThumbnailPath) copiedPaths.push(duplicatedThumbnailPath);
      await this.database.withTransactionAsync(async () => {
        await this.database.runAsync(
          `INSERT INTO documents (id, title, created_at, updated_at, thumbnail_path, pdf_path, ocr_status, quality_summary, folder_id, tags_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          duplicateId,
          title.trim() || 'Copy of document',
          now,
          now,
          duplicatedThumbnailPath,
          duplicatedPdfPath,
          'not_started',
          source.quality_summary,
          source.folder_id,
          source.tags_json,
        );
        for (const page of pages) {
          const sourcePath = await copyFile(page.source_image_path);
          copiedPaths.push(sourcePath);
          const processedPath = page.processed_image_path
            ? await copyFile(page.processed_image_path)
            : null;
          if (processedPath) copiedPaths.push(processedPath);
          await this.database.runAsync(
            `INSERT INTO pages (id, document_id, position, source_image_path, processed_image_path, corners_json, rotation, filter, ocr_status, ocr_text, ocr_blocks_json, ocr_confidence, ocr_corrections_json, quality_score, quality_reasons_json, edit_parameters_json, edit_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            `${duplicateId}-${page.id}`,
            duplicateId,
            page.position,
            sourcePath,
            processedPath,
            page.corners_json,
            page.rotation,
            page.filter,
            page.ocr_status,
            null,
            null,
            null,
            '[]',
            page.quality_score,
            page.quality_reasons_json,
            page.edit_parameters_json,
            page.edit_version,
          );
        }
      });
    } catch (error) {
      if (removeFile) {
        await Promise.all(copiedPaths.map((path) => removeFile(path).catch(() => undefined)));
      }
      throw error;
    }
  }

  async listPages(documentId: string): Promise<readonly Page[]> {
    const rows = await this.database.getAllAsync<PageRow>(
      'SELECT * FROM pages WHERE document_id = ? ORDER BY position ASC',
      documentId,
    );
    return rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      position: row.position,
      sourceImagePath: row.source_image_path,
      processedImagePath: row.processed_image_path,
      corners: row.corners_json ? (JSON.parse(row.corners_json) as Page['corners']) : null,
      rotation: row.rotation,
      filter: row.filter,
      ocrStatus: row.ocr_status,
      qualityScore: row.quality_score,
      qualityReasons: parseStringArray(row.quality_reasons_json),
      editVersion: row.edit_version,
    }));
  }

  async search(query: string): Promise<readonly Document[]> {
    const normalized = normalizeSearchText(query);
    const rows = await this.database.getAllAsync<DocumentRow>(
      `SELECT d.*, COUNT(p.id) AS page_count FROM page_search s JOIN documents d ON d.id = s.document_id LEFT JOIN pages p ON p.document_id = d.id WHERE s.normalized_text MATCH ? OR d.title LIKE ? GROUP BY d.id ORDER BY d.updated_at DESC`,
      normalized,
      `%${query}%`,
    );
    return rows.map((row) => ({
      ...row,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      pageCount: row.page_count,
      thumbnailPath: row.thumbnail_path,
      pdfPath: row.pdf_path,
      ocrStatus: row.ocr_status,
      qualitySummary: row.quality_summary,
      folderId: row.folder_id,
      tags: parseStringArray(row.tags_json),
    }));
  }

  async deleteDocument(documentId: string): Promise<readonly string[]> {
    const pages = await this.database.getAllAsync<{
      source_image_path: string;
      processed_image_path: string | null;
    }>(
      'SELECT source_image_path, processed_image_path FROM pages WHERE document_id = ?',
      documentId,
    );
    const document = await this.database.getFirstAsync<{
      thumbnail_path: string | null;
      pdf_path: string | null;
    }>('SELECT thumbnail_path, pdf_path FROM documents WHERE id = ?', documentId);
    await this.database.runAsync('DELETE FROM documents WHERE id = ?', documentId);
    return [
      ...pages.flatMap((page) => [page.source_image_path, page.processed_image_path]),
      document?.thumbnail_path,
      document?.pdf_path,
    ].filter((path): path is string => Boolean(path));
  }
}
