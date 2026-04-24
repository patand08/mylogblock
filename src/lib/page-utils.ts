import { Page, CreatePageInput, UpdatePageInput } from "@/types";

/**
 * Creates a new page object (no DB yet — pure domain logic).
 */
export function createPageObject(
  input: CreatePageInput,
  workspaceId: string,
  orderIndex: number,
  id?: string
): Page {
  const now = new Date().toISOString();
  return {
    id: id ?? crypto.randomUUID(),
    workspace_id: workspaceId,
    parent_id: input.parent_id ?? null,
    title: input.title.trim() || "Untitled",
    icon: input.icon ?? null,
    cover_image_url: input.cover_image_url ?? null,
    cover_image_position: 50,
    body: null,
    created_at: now,
    updated_at: now,
    created_by: "anonymous",
    order_index: orderIndex,
    is_deleted: false,
  };
}

/**
 * Applies an update to a page object (pure, returns new object).
 */
export function applyPageUpdate(page: Page, update: UpdatePageInput): Page {
  return {
    ...page,
    ...update,
    title: update.title !== undefined
      ? (update.title.trim() || "Untitled")
      : page.title,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Soft-deletes a page (pure).
 */
export function softDeletePage(page: Page): Page {
  return { ...page, is_deleted: true, updated_at: new Date().toISOString() };
}

/**
 * Builds a page tree from a flat list.
 * Root pages are those with parent_id === null.
 */
export interface PageTreeNode {
  page: Page;
  children: PageTreeNode[];
}

export function buildPageTree(pages: Page[]): PageTreeNode[] {
  const active = pages.filter((p) => !p.is_deleted);
  const byParent: Record<string, Page[]> = {};

  for (const page of active) {
    const key = page.parent_id ?? "root";
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(page);
  }

  const sortByOrder = (arr: Page[]) =>
    [...arr].sort((a, b) => a.order_index - b.order_index);

  function buildChildren(parentId: string): PageTreeNode[] {
    return sortByOrder(byParent[parentId] ?? []).map((page) => ({
      page,
      children: buildChildren(page.id),
    }));
  }

  return buildChildren("root");
}

/**
 * Gets the breadcrumb path from root to the given page id.
 */
export function getPageBreadcrumbs(pages: Page[], pageId: string): Page[] {
  const map = new Map(pages.map((p) => [p.id, p]));
  const path: Page[] = [];
  let current = map.get(pageId);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? map.get(current.parent_id) : undefined;
  }
  return path;
}
