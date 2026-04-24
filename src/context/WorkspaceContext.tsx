import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Page, CreatePageInput, UpdatePageInput } from "@/types";
import { createPageObject, applyPageUpdate, buildPageTree, PageTreeNode } from "@/lib/page-utils";
import { fetchPages, insertPage, patchPage, softDeletePage as deletePageInDb, reorderPagesInDb } from "@/lib/pageRepo";
import { reorderPages } from "@/lib/drag-utils";

const WORKSPACE_ID = "local-workspace";

interface WorkspaceContextValue {
  pages: Page[];
  tree: PageTreeNode[];
  activePageId: string | null;
  setActivePageId: (id: string | null) => void;
  createPage: (input: CreatePageInput) => Page;
  updatePage: (id: string, updates: UpdatePageInput) => void;
  deletePage: (id: string) => void;
  reorderPagesOpt: (activeId: string, overId: string) => void;
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load pages from Supabase on mount
  useEffect(() => {
    fetchPages(WORKSPACE_ID)
      .then(setPages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const createPage = useCallback((input: CreatePageInput): Page => {
    const siblings = pages.filter((p) => p.parent_id === (input.parent_id ?? null) && !p.is_deleted);
    const maxOrder = siblings.reduce((m, p) => Math.max(m, p.order_index), -1);
    const local = createPageObject(input, WORKSPACE_ID, maxOrder + 1);
    setPages((prev) => [...prev, local]);
    // Persist to DB in background; swap local ID → DB ID when done
    insertPage({ ...input, workspace_id: WORKSPACE_ID, order_index: maxOrder + 1 })
      .then((saved) => {
        setPages((prev) => prev.map((p) => (p.id === local.id ? saved : p)));
        setActivePageId((prev) => (prev === local.id ? saved.id : prev));
      })
      .catch((e: unknown) => {
        setPages((prev) => prev.filter((p) => p.id !== local.id));
        setError(e instanceof Error ? e.message : "Failed to create page");
      });
    return local;
  }, [pages]);

  const updatePage = useCallback((id: string, updates: UpdatePageInput): void => {
    setPages((prev) => prev.map((p) => (p.id === id ? applyPageUpdate(p, updates) : p)));
    patchPage(id, updates).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to update page");
      fetchPages(WORKSPACE_ID).then(setPages);
    });
  }, []);

  const deletePage = useCallback((id: string): void => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, is_deleted: true } : p)));
    setActivePageId((prev) => (prev === id ? null : prev));
    deletePageInDb(id).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Failed to delete page");
      fetchPages(WORKSPACE_ID).then(setPages);
    });
  }, []);

  const reorderPagesOpt = useCallback((activeId: string, overId: string) => {
    setPages((prev) => {
      const reordered = reorderPages(prev, activeId, overId);
      // Persist to DB (fire-and-forget with error logging)
      const updates = reordered
        .filter((p) => !p.is_deleted)
        .map((p) => ({ id: p.id, order_index: p.order_index, parent_id: p.parent_id }));
      reorderPagesInDb(updates).catch((e) => console.error("Reorder failed:", e));
      return reordered;
    });
  }, []);

  const tree = buildPageTree(pages);

  return (
    <WorkspaceContext.Provider value={{ pages, tree, activePageId, setActivePageId, createPage, updatePage, deletePage, reorderPagesOpt, loading, error }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
