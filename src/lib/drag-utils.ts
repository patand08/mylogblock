import { Page } from "@/types";

/**
 * Reorders pages within the same parent after a drag-drop.
 * Returns updated pages with new order_index values.
 */
const INDENT_THRESHOLD = 24;
const OUTDENT_THRESHOLD = -24;

function isDescendant(
  byId: Map<string, Page>,
  candidateId: string,
  ancestorId: string
): boolean {
  let current = byId.get(candidateId);
  while (current?.parent_id) {
    if (current.parent_id === ancestorId) return true;
    current = byId.get(current.parent_id);
  }
  return false;
}

function normalizeSiblingOrder(pages: Page[], parentId: string | null): Page[] {
  const siblings = pages
    .filter((p) => p.parent_id === parentId && !p.is_deleted)
    .sort((a, b) => a.order_index - b.order_index);
  const map = new Map(siblings.map((p, index) => [p.id, index]));
  return pages.map((p) => (map.has(p.id) ? { ...p, order_index: map.get(p.id)! } : p));
}

export function reorderPages(
  pages: Page[],
  activeId: string,
  overId: string,
  horizontalDelta = 0
): Page[] {
  if (activeId === overId) return pages;

  const active = pages.find((p) => p.id === activeId);
  const over = pages.find((p) => p.id === overId);

  if (!active || !over) return pages;

  const byId = new Map(pages.map((p) => [p.id, p]));
  const movingToChild = horizontalDelta > INDENT_THRESHOLD;
  const movingOut = horizontalDelta < OUTDENT_THRESHOLD;

  let targetParentId = over.parent_id;
  if (movingToChild) {
    // Prevent dropping a parent inside its own descendant subtree.
    if (isDescendant(byId, over.id, active.id)) return pages;
    targetParentId = over.id;
  } else if (movingOut && active.parent_id) {
    const parent = byId.get(active.parent_id);
    targetParentId = parent?.parent_id ?? null;
  }

  let nextPages = pages.map((p) =>
    p.id === active.id ? { ...p, parent_id: targetParentId } : p
  );

  const targetSiblings = nextPages
    .filter((p) => p.parent_id === targetParentId && !p.is_deleted && p.id !== active.id)
    .sort((a, b) => a.order_index - b.order_index);
  const movedPage = nextPages.find((p) => p.id === active.id)!;

  let insertIndex = targetSiblings.findIndex((p) => p.id === over.id);
  if (movingToChild) {
    insertIndex = targetSiblings.length;
  } else if (movingOut && active.parent_id) {
    const parent = byId.get(active.parent_id);
    const parentIndex = parent
      ? targetSiblings.findIndex((p) => p.id === parent.id)
      : -1;
    insertIndex = parentIndex === -1 ? targetSiblings.length : parentIndex + 1;
  } else if (insertIndex === -1) {
    insertIndex = targetSiblings.length;
  }

  const reorderedTarget = [...targetSiblings];
  reorderedTarget.splice(insertIndex, 0, movedPage);
  const targetMap = new Map(reorderedTarget.map((p, i) => [p.id, i]));

  nextPages = nextPages.map((p) =>
    targetMap.has(p.id) ? { ...p, order_index: targetMap.get(p.id)! } : p
  );

  nextPages = normalizeSiblingOrder(nextPages, active.parent_id);
  if (targetParentId !== active.parent_id) {
    nextPages = normalizeSiblingOrder(nextPages, targetParentId);
  }

  return nextPages;
}
