export function uniqueIds(lists: Array<string[] | undefined | null>): string[] {
  const out = new Set<string>();
  for (const list of lists) {
    for (const value of list || []) {
      const id = String(value || "").trim();
      if (id) out.add(id);
    }
  }
  return [...out];
}

export function mergeById<T extends { id: string }>(base: T[] = [], next: T[] = []): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return [...map.values()];
}

export function isDeletedLinkId(deletedIds: string[] | undefined, idOrSlug: string): boolean {
  const needle = String(idOrSlug || "").trim();
  if (!needle) return false;
  return (deletedIds || []).includes(needle);
}

export function mergePaymentLinks<T extends { id: string; slug?: string }>(
  base: T[] = [],
  next: T[] = [],
  deletedIds: string[] = [],
): T[] {
  const deleted = new Set(deletedIds);
  return mergeById(base, next).filter((item) => !deleted.has(item.id) && !(item.slug && deleted.has(item.slug)));
}
