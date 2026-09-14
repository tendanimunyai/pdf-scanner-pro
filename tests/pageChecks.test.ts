import { describe, expect, it } from 'vitest';

import { isLikelyBlankPage, isProbableDuplicate } from '../src/domain/pageChecks';

describe('page quality checks', () => {
  it('flags a uniformly bright sampled page as blank', () => {
    expect(isLikelyBlankPage({ width: 2, height: 2, values: [0.99, 0.98, 0.99, 1] })).toBe(true);
  });

  it('flags near-identical samples as probable duplicates', () => {
    expect(
      isProbableDuplicate(
        { width: 2, height: 2, values: [0.1, 0.2, 0.3, 0.4] },
        { width: 2, height: 2, values: [0.11, 0.2, 0.29, 0.4] },
      ),
    ).toBe(true);
  });
});
