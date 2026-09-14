import { createJob } from '../domain/jobs';
import * as FileSystem from 'expo-file-system/legacy';
import { canExportSearchable, type ExportQuality } from '../domain/export';
import type { OcrPage } from '../domain/ocr';
import { writeAtomically } from './atomicFiles';
import type { DocumentRepository } from './documentRepository';
import type { PdfPage, PdfService } from './scannerServices';
import { ensureStorageAvailable } from './storagePreflight';

export type ExportWorkflowInput = Readonly<{
  documentId: string;
  title: string;
  pages: readonly (PdfPage & { ocr: OcrPage })[];
  quality: ExportQuality;
  outputPath: string;
  now: () => string;
  getFreeBytes?: () => Promise<number>;
  /** Image-only mode is the safe fallback when OCR failed on one or more pages. */
  mode?: 'searchable' | 'image_only';
}>;

export async function exportDocument(
  repository: DocumentRepository,
  pdf: PdfService,
  input: ExportWorkflowInput,
): Promise<string> {
  if (input.mode !== 'image_only' && !canExportSearchable(input.pages.map((page) => page.ocr)))
    throw new Error('model_unavailable');
  const job = createJob(`export-${input.documentId}`, 'export', input.documentId, input.now());
  await repository.enqueueJob(job);
  await repository.transitionJob(job.id, 'running', input.now());
  try {
    if (input.getFreeBytes) {
      const estimate = await pdf.estimateSize(input.pages, input.quality);
      await ensureStorageAvailable(estimate, input.getFreeBytes);
    }
    await writeAtomically(
      input.outputPath,
      async (temporaryPath) => {
        await pdf.exportSearchable({
          title: input.title,
          pages: input.pages,
          quality: input.quality,
          outputPath: temporaryPath,
        });
      },
      async (temporaryPath) => {
        const info = await FileSystem.getInfoAsync(temporaryPath);
        return info.exists && 'size' in info && info.size > 0;
      },
    );
    await repository.transitionJob(job.id, 'success', input.now());
    return input.outputPath;
  } catch (error) {
    const errorCode =
      error instanceof Error && error.message === 'export_cancelled'
        ? 'export_cancelled'
        : error instanceof Error && error.message === 'storage_full'
          ? 'storage_full'
          : 'processing_failed';
    await repository.transitionJob(job.id, 'failure', input.now(), errorCode);
    throw error;
  }
}
