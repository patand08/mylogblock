import { Page } from "@/types";

/**
 * Reorders pages within the same parent after a drag-drop.
 * Returns updated pages with new order_index values.
 */
export function reorderPages(
  pages: Page[],
  activeId: string,
  overId: string
): Page[] {
  if (activeId === overId) return pages;

  const active = pages.find((p) => p.id === activeId);
  const over = pages.find((p) => p.id === overId);

  if (!active || !over) return pages;
  // Must be same parent to reorder
  if (active.parent_id !== over.parent_id) return pages;

  const siblings = pages
    .filter((p) => p.parent_id === active.parent_id && !p.is_deleted)
    .sort((a, b) => a.order_index - b.order_index);

  const fromIndex = siblings.findIndex((p) => p.id === activeId);
  const toIndex = siblings.findIndex((p) => p.id === overId);

  if (fromIndex === -1 || toIndex === -1) return pages;

  const reordered = [...siblings];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  const updatedMap = new Map(
    reordered.map((p, i) => [p.id, i])
  );

  return pages.map((p) =>
    updatedMap.has(p.id) ? { ...p, order_index: updatedMap.get(p.id)! } : p
  );
}
