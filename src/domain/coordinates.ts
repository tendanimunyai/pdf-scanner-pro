import type { Point } from './models';

export type Size = Readonly<{ width: number; height: number }>;
export type NormalizedRect = Readonly<{ x: number; y: number; width: number; height: number }>;

export function normalizePoint(point: Point, size: Size): Point {
  if (size.width <= 0 || size.height <= 0) throw new Error('invalid_input');
  return { x: point.x / size.width, y: point.y / size.height };
}

export function denormalizePoint(point: Point, size: Size): Point {
  if (size.width <= 0 || size.height <= 0) throw new Error('invalid_input');
  return { x: point.x * size.width, y: point.y * size.height };
}

export function rotatePoint(point: Point, size: Size, degrees: 0 | 90 | 180 | 270): Point {
  switch (degrees) {
    case 0:
      return point;
    case 90:
      return { x: size.height - point.y, y: point.x };
    case 180:
      return { x: size.width - point.x, y: size.height - point.y };
    case 270:
      return { x: point.y, y: size.width - point.x };
  }
}

export function clampRect(rect: NormalizedRect): NormalizedRect {
  const x = Math.min(1, Math.max(0, rect.x));
  const y = Math.min(1, Math.max(0, rect.y));
  const right = Math.min(1, Math.max(x, rect.x + rect.width));
  const bottom = Math.min(1, Math.max(y, rect.y + rect.height));
  return { x, y, width: right - x, height: bottom - y };
}
