export type OrderedPage = Readonly<{ id: string; position: number }>;

export function reorderPages<T extends OrderedPage>(
  pages: readonly T[],
  orderedIds: readonly string[],
): (T & { position: number })[] {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const uniqueIds = new Set(orderedIds);
  if (
    orderedIds.length !== pages.length ||
    uniqueIds.size !== pages.length ||
    pages.some((page) => !uniqueIds.has(page.id))
  ) {
    throw new Error('The new order must contain every page exactly once.');
  }
  return orderedIds.map((id, position) => {
    const page = byId.get(id);
    if (!page) throw new Error(`Unknown page id at position ${String(position)}.`);
    return { ...page, position };
  });
}
