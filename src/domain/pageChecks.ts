export type SampledPixels = Readonly<{
  /** Normalized grayscale samples in row-major order. */
  values: readonly number[];
  width: number;
  height: number;
}>;

function valid(sample: SampledPixels): boolean {
  return (
    Number.isSafeInteger(sample.width) &&
    Number.isSafeInteger(sample.height) &&
    sample.width > 0 &&
    sample.height > 0 &&
    sample.values.length === sample.width * sample.height &&
    sample.values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)
  );
}

export function isLikelyBlankPage(sample: SampledPixels, varianceThreshold = 0.002): boolean {
  if (!valid(sample) || varianceThreshold < 0) throw new Error('invalid_input');
  const mean = sample.values.reduce((sum, value) => sum + value, 0) / sample.values.length;
  const variance =
    sample.values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sample.values.length;
  return mean > 0.92 && variance < varianceThreshold;
}

export function isProbableDuplicate(
  first: SampledPixels,
  second: SampledPixels,
  meanAbsoluteDifference = 0.035,
): boolean {
  if (
    !valid(first) ||
    !valid(second) ||
    first.width !== second.width ||
    first.height !== second.height
  )
    throw new Error('invalid_input');
  if (meanAbsoluteDifference < 0) throw new Error('invalid_input');
  const difference =
    first.values.reduce(
      (sum, value, index) => sum + Math.abs(value - (second.values[index] ?? 0)),
      0,
    ) / first.values.length;
  return difference <= meanAbsoluteDifference;
}
