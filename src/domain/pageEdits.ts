import type { PageFilter } from './models';

export type PageRotation = 0 | 90 | 180 | 270;

export type PageEditState = Readonly<{
  rotation: PageRotation;
  filter: PageFilter;
  crop: Readonly<{ x: number; y: number; width: number; height: number }>;
  version: number;
}>;

const fullCrop = { x: 0, y: 0, width: 1, height: 1 } as const;

export const initialPageEdit: PageEditState = {
  rotation: 0,
  filter: 'original',
  crop: fullCrop,
  version: 1,
};

function unit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normalizePageEdit(
  edit: Partial<Omit<PageEditState, 'version'>> & Readonly<{ version?: number }>,
): PageEditState {
  const x = unit(edit.crop?.x ?? 0);
  const y = unit(edit.crop?.y ?? 0);
  const right = unit((edit.crop?.x ?? 0) + (edit.crop?.width ?? 1));
  const bottom = unit((edit.crop?.y ?? 0) + (edit.crop?.height ?? 1));
  return {
    rotation: edit.rotation ?? 0,
    filter: edit.filter ?? 'original',
    crop: { x, y, width: Math.max(0.001, right - x), height: Math.max(0.001, bottom - y) },
    version:
      typeof edit.version === 'number' && Number.isSafeInteger(edit.version)
        ? Math.max(1, edit.version)
        : 1,
  };
}

export function updatePageEdit(
  current: PageEditState,
  patch: Partial<Omit<PageEditState, 'version'>>,
): PageEditState {
  return normalizePageEdit({ ...current, ...patch, version: current.version + 1 });
}
