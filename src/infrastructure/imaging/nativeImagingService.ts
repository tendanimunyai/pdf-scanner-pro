import { NativeModules } from 'react-native';

import type { Corners } from '../../domain/models';
import type { ImagingService, QualityResult } from '../../services/scannerServices';

type NativeImagingModule = Readonly<{
  analyzeQuality(path: string): Promise<QualityResult>;
  detectCorners(path: string): Promise<Corners | null>;
  processPage(
    input: Readonly<{
      sourcePath: string;
      corners: Corners | null;
      rotation: number;
      filter: string;
    }>,
  ): Promise<string>;
}>;

function nativeModule(): NativeImagingModule | null {
  const candidate: unknown = NativeModules.PDFScannerProImaging;
  if (!candidate || typeof candidate !== 'object') return null;
  const methods = candidate as Partial<Record<keyof NativeImagingModule, unknown>>;
  if (Object.values(methods).some((method) => typeof method !== 'function')) return null;
  return candidate as NativeImagingModule;
}

export const nativeImagingService: ImagingService = {
  async analyzeQuality(sourcePath) {
    const module = nativeModule();
    if (!module) return { band: 'retake', score: 0, reasonCodes: ['missing_corners'] };
    return module.analyzeQuality(sourcePath);
  },
  async detectCorners(sourcePath) {
    const module = nativeModule();
    if (!module) return null;
    return module.detectCorners(sourcePath);
  },
  async processPage(input) {
    const module = nativeModule();
    if (!module) throw new Error('model_unavailable');
    return module.processPage({ ...input, rotation: input.rotation, filter: input.filter });
  },
};
