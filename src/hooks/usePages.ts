import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { Page, CreatePageInput, UpdatePageInput } from "@/types";
import {
  createPageObject,
  applyPageUpdate,
  softDeletePage,
  buildPageTree,
  PageTreeNode,
} from "@/lib/page-utils";

let _idCounter = 0;
function generateId(prefix = "page"): string {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
}

interface UsePagesReturn {
  pages: Page[];
  tree: PageTreeNode[];
  createPage: (input: Omit<CreatePageInput, "workspace_id">) => Page;
  updatePage: (pageId: string, update: UpdatePageInput) => void;
  deletePage: (pageId: string) => void;
  setPages: Dispatch<SetStateAction<Page[]>>;
}

export function usePages(workspaceId: string, initial: Page[] = []): UsePagesReturn {
  const [pages, setPages] = useState<Page[]>(initial);

  const createPage = useCallback(
    (input: Omit<CreatePageInput, "workspace_id">): Page => {
      const siblings = pages.filter(
        (p) => p.parent_id === (input.parent_id ?? null) && !p.is_deleted
      );
      const order_index = siblings.length;
      const page = createPageObject(input, workspaceId, order_index, generateId());
      setPages((prev) => [...prev, page]);
      return page;
    },
    [pages, workspaceId]
  );

  const updatePage = useCallback((pageId: string, update: UpdatePageInput) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? applyPageUpdate(p, update) : p))
    );
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? softDeletePage(p) : p))
    );
  }, []);

  const tree = buildPageTree(pages);

  return { pages, tree, createPage, updatePage, deletePage, setPages };
}
