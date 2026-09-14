import type { Corners, PageFilter } from '../domain/models';

export type OperationState = 'idle' | 'queued' | 'running' | 'success' | 'cancelled' | 'failure';

export type QualityResult = Readonly<{
  band: 'excellent' | 'usable' | 'retake';
  score: number;
  reasonCodes: readonly ('blur' | 'glare' | 'missing_corners' | 'low_resolution' | 'obstruction')[];
}>;

export interface ImagingService {
  analyzeQuality(sourcePath: string): Promise<QualityResult>;
  detectCorners(sourcePath: string): Promise<Corners | null>;
  processPage(
    input: Readonly<{
      sourcePath: string;
      corners: Corners | null;
      rotation: 0 | 90 | 180 | 270;
      filter: PageFilter;
      signal?: AbortSignal;
    }>,
  ): Promise<string>;
}

export type OcrWord = Readonly<{
  text: string;
  confidence: number | null;
  bounds: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;
export type OcrResult = Readonly<{
  text: string;
  words: readonly OcrWord[];
  language: 'en';
  orientation: 0 | 90 | 180 | 270;
}>;

export interface OcrService {
  recognize(
    processedPath: string,
    options?: Readonly<{ signal?: AbortSignal }>,
  ): Promise<OcrResult>;
}

export type PdfPage = Readonly<{
  imagePath: string;
  width: number;
  height: number;
  words: readonly OcrWord[];
}>;
export interface PdfService {
  estimateSize(pages: readonly PdfPage[], quality: 'low' | 'medium' | 'high'): Promise<number>;
  exportSearchable(
    input: Readonly<{
      title: string;
      pages: readonly PdfPage[];
      quality: 'low' | 'medium' | 'high';
      outputPath: string;
      signal?: AbortSignal;
    }>,
  ): Promise<string>;
}

/** Used until the platform native module is installed; failures are explicit and recoverable. */
export const unavailableImagingService: ImagingService = {
  analyzeQuality: () =>
    Promise.resolve({ band: 'usable', score: 0, reasonCodes: ['missing_corners'] as const }),
  detectCorners: () => Promise.resolve(null),
  processPage: () => Promise.reject(new Error('model_unavailable')),
};

export const unavailableOcrService: OcrService = {
  recognize: () => Promise.reject(new Error('model_unavailable')),
};

export const unavailablePdfService: PdfService = {
  estimateSize: () => Promise.resolve(0),
  exportSearchable: () => Promise.reject(new Error('model_unavailable')),
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
