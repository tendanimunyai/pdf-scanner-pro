import { createJob } from '../domain/jobs';
import type { DocumentRepository } from './documentRepository';
import type { ImagingService, OcrService } from './scannerServices';

export type ProcessPageInput = Readonly<{
  documentId: string;
  pageId: string;
  sourcePath: string;
  rotation: 0 | 90 | 180 | 270;
  filter: 'original' | 'color' | 'grayscale' | 'black_and_white';
  now: () => string;
  signal?: AbortSignal;
}>;

export async function processPage(
  repository: DocumentRepository,
  imaging: ImagingService,
  ocr: OcrService,
  input: ProcessPageInput,
): Promise<Readonly<{ processedPath: string; text: string; confidence: number | null }>> {
  const processingJob = createJob(
    `processing-${input.pageId}`,
    'processing',
    input.pageId,
    input.now(),
  );
  await repository.enqueueJob(processingJob);
  await repository.transitionJob(processingJob.id, 'running', input.now());
  let processingSucceeded = false;
  try {
    if (input.signal?.aborted) throw new Error('export_cancelled');
    const quality = await imaging.analyzeQuality(input.sourcePath);
    if (input.signal?.aborted) throw new Error('export_cancelled');
    await repository.updatePageQuality(
      input.pageId,
      { score: quality.score, reasons: quality.reasonCodes },
      input.now(),
    );
    const processedPath = await imaging.processPage({
      sourcePath: input.sourcePath,
      corners: await imaging.detectCorners(input.sourcePath),
      rotation: input.rotation,
      filter: input.filter,
      ...(input.signal ? { signal: input.signal } : {}),
    });
    if (input.signal?.aborted) throw new Error('export_cancelled');
    await repository.updatePageEdit(
      input.pageId,
      { rotation: input.rotation, filter: input.filter, processedImagePath: processedPath },
      input.now(),
    );
    await repository.transitionJob(processingJob.id, 'success', input.now());
    processingSucceeded = true;

    const ocrJob = createJob(`ocr-${input.pageId}`, 'ocr', input.pageId, input.now());
    await repository.enqueueJob(ocrJob);
    await repository.transitionJob(ocrJob.id, 'running', input.now());
    try {
      const result = await ocr.recognize(
        processedPath,
        input.signal ? { signal: input.signal } : undefined,
      );
      if (input.signal?.aborted) throw new Error('export_cancelled');
      const confidenceValues = result.words
        .map((word) => word.confidence)
        .filter((value): value is number => value !== null);
      const confidence =
        confidenceValues.length > 0
          ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
          : null;
      await repository.setOcr(
        input.pageId,
        { text: result.text, confidence, blocksJson: JSON.stringify(result.words) },
        input.now(),
      );
      await repository.transitionJob(ocrJob.id, 'success', input.now());
      return { processedPath, text: result.text, confidence };
    } catch (error) {
      await repository.markOcrFailed(input.pageId, input.now());
      await repository.transitionJob(ocrJob.id, 'failure', input.now(), 'model_unavailable');
      throw error;
    }
  } catch (error) {
    if (!processingSucceeded)
      await repository.transitionJob(processingJob.id, 'failure', input.now(), 'processing_failed');
    throw error;
  }
}
