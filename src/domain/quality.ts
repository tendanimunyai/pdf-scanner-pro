import type { QualityBand } from './models';

export type QualityMetrics = Readonly<{
  blur: number;
  glare: number;
  resolution: number;
  cornerCoverage: number;
  obstruction: number;
}>;

export type QualityAssessment = Readonly<{
  band: QualityBand;
  score: number;
  reasons: readonly string[];
}>;

/** Pure scoring policy; native imaging adapters provide the normalized metrics. */
export function assessQuality(metrics: QualityMetrics): QualityAssessment {
  const reasons: string[] = [];
  if (metrics.blur < 0.45) reasons.push('blur');
  if (metrics.glare > 0.55) reasons.push('glare');
  if (metrics.resolution < 0.5) reasons.push('low_resolution');
  if (metrics.cornerCoverage < 0.7) reasons.push('missing_corners');
  if (metrics.obstruction > 0.35) reasons.push('obstruction');
  const score = Math.round(
    100 *
      (0.3 * metrics.blur +
        0.2 * (1 - metrics.glare) +
        0.2 * metrics.resolution +
        0.2 * metrics.cornerCoverage +
        0.1 * (1 - metrics.obstruction)),
  );
  const band: QualityBand =
    reasons.length > 1 || score < 45 ? 'retake' : score >= 80 ? 'excellent' : 'usable';
  return { band, score, reasons };
}
