import { NativeModules, Platform } from 'react-native';

import type { OcrResult, OcrService, OcrWord } from '../../services/scannerServices';

type NativeWord = Readonly<{
  text: string;
  confidence?: number | null;
  bounds: Readonly<{ x: number; y: number; width: number; height: number }>;
}>;

type NativeResponse = Readonly<{
  text: string;
  orientation: 0 | 90 | 180 | 270;
  words: readonly NativeWord[];
}>;

type NativeOcrModule = Readonly<{
  recognize(path: string, language: string): Promise<NativeResponse>;
}>;

function nativeModule(): NativeOcrModule | null {
  const candidate: unknown = NativeModules.PDFScannerProOCR;
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    typeof (candidate as { recognize?: unknown }).recognize !== 'function'
  )
    return null;
  return candidate as NativeOcrModule;
}

export const nativeOcrService: OcrService = {
  async recognize(processedPath, options) {
    if (options?.signal?.aborted) throw new Error('export_cancelled');
    const module = nativeModule();
    if (!module) throw new Error('model_unavailable');
    const result = await module.recognize(processedPath, 'en');
    if (options?.signal?.aborted) throw new Error('export_cancelled');
    const words: OcrWord[] = result.words.map((word, index) => ({
      text: word.text,
      confidence: word.confidence ?? null,
      bounds: word.bounds,
    }));
    return {
      text: result.text,
      words,
      language: 'en',
      orientation: result.orientation,
    } satisfies OcrResult;
  },
};

export const ocrPlatform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
