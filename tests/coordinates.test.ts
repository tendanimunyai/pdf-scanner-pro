import { describe, expect, it } from 'vitest';

import {
  clampRect,
  denormalizePoint,
  normalizePoint,
  rotatePoint,
} from '../src/domain/coordinates';
import { assessQuality } from '../src/domain/quality';

describe('coordinate transforms', () => {
  it('round-trips normalized points', () => {
    const size = { width: 1000, height: 500 };
    expect(denormalizePoint(normalizePoint({ x: 250, y: 125 }, size), size)).toEqual({
      x: 250,
      y: 125,
    });
  });

  it('rotates points in source-image space', () => {
    expect(rotatePoint({ x: 10, y: 20 }, { width: 100, height: 200 }, 90)).toEqual({
      x: 180,
      y: 10,
    });
  });

  it('clamps crop rectangles to the image bounds', () => {
    expect(clampRect({ x: -0.2, y: 0.1, width: 1.4, height: 1.2 })).toEqual({
      x: 0,
      y: 0.1,
      width: 1,
      height: 0.9,
    });
  });

  it('returns actionable quality reasons for poor captures', () => {
    expect(
      assessQuality({ blur: 0.2, glare: 0.8, resolution: 0.4, cornerCoverage: 0.5, obstruction: 0 })
        .band,
    ).toBe('retake');
    expect(
      assessQuality({
        blur: 0.95,
        glare: 0.05,
        resolution: 0.95,
        cornerCoverage: 0.95,
        obstruction: 0.05,
      }),
    ).toMatchObject({ band: 'excellent', reasons: [] });
  });
});
