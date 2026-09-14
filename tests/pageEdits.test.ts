import { describe, expect, it } from 'vitest';

import { initialPageEdit, normalizePageEdit, updatePageEdit } from '../src/domain/pageEdits';

describe('reversible page edit state', () => {
  it('clamps crop bounds and keeps the source-independent edit parameters', () => {
    const edit = normalizePageEdit({
      rotation: 90,
      crop: { x: -0.2, y: 0.1, width: 1.5, height: 0.4 },
    });
    expect(edit).toEqual({
      rotation: 90,
      filter: 'original',
      crop: { x: 0, y: 0.1, width: 1, height: 0.4 },
      version: 1,
    });
  });

  it('increments version when a user changes an edit', () => {
    expect(updatePageEdit(initialPageEdit, { filter: 'grayscale' })).toMatchObject({
      filter: 'grayscale',
      version: 2,
    });
  });
});
